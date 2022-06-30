// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import "./IERC20.sol";
import "./SafeMath.sol";
import "./SafeERC20.sol";
import "./Create2.sol";
import "./InitializableAdminUpgradeabilityProxy.sol";
import "./IUniswapFactory.sol";
import "./IUniswapPair.sol";
import "./IUniswapRouter02.sol";

interface IDAOMintingPool {
    function getuserTotalVeDao(address who) external view returns (uint256);

    function getcalculatestakingAmount() external view returns (uint256);

    function getuserTotalDao(address who, address lpToken) external view returns (uint256);

    function getpoolStakingTotal(address lpToken) external view returns (uint256);

    function addBonusToken_vote(
        address bsToken,
        uint256 amount,
        uint256 expirationTimestamps
    ) external returns (bool); //合约调价矿池
}

interface IidovoteContract {
    function getVoteStatus(address coinAddress) external view returns (bool);
}

interface IswapContract {
    function autoSwapTokens(
        address token0,
        address token1,
        uint256 amountIn,
        address to
    ) external;

    function autoSwapEthToTokens(
        address token,
        uint256 amountIn,
        address to
    ) external;
}

/*
 * 上币 合约
 */
contract idoCoinContract is Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    uint256 public priceDecimals;
    uint256 public registerAmount;
    uint256 private deductAmount; //扣取注册费用
    uint8 private TOKEN_DECIMALS;
    uint8 private PRICE_DECIMALS;
    IERC20 public COIN;
    IERC20 public DAOToken;
    IDAOMintingPool public daoMintingPool;
    IidovoteContract public idovoteContract;
    IswapContract public swapContract;

    uint256 applyCoinId;
    address public daoAddress;
    uint256 public registeFee;

    mapping(address => uint256) swapBuyDao;

    address public router;
    address public factory;
    address public ISMPolicy;
    //分配机制
    uint256 public zeorAddrAmount; //黑洞地址  30%
    uint256 public mintingAddrAmount; //矿池地址  20%
    uint256 public treasuryAddrAmount; //金库地址  30%
    uint256 public businessAddrAmount; //业务经理 10%
    uint256 public statAddrAmount; //星探  10%
    uint256 private ipoTime;

    constructor(
        IERC20 _DAOToken,
        IDAOMintingPool _IDAOMintingPool,
        IidovoteContract _IidovoteContract,
        address router_,
        IswapContract _IswapContract
    ) {
        initializeOwner();

        daoMintingPool = _IDAOMintingPool;
        idovoteContract = _IidovoteContract;
        swapContract = _IswapContract;
        DAOToken = _DAOToken;
        priceDecimals = 4;
        TOKEN_DECIMALS = 18;
        PRICE_DECIMALS = 6;
        registerAmount = 1 * (10**uint256(TOKEN_DECIMALS));
        deductAmount = 1 * (8**uint256(TOKEN_DECIMALS));
        applyCoinId = 1;
        addapplyCoin(msg.sender, "ETH", 18);
        registeFee = 0;
        _owner = msg.sender;
        router = router_;
        zeorAddrAmount = 0;
        mintingAddrAmount = 0;
        treasuryAddrAmount = 0;
        businessAddrAmount = 0;
        statAddrAmount = 0;
        ISMPolicy = msg.sender;
        ipoTime = 86400 * 5;
    }

    struct idoCoinInfoHead {
        address coinAddress; //募集币种地址
        string symbol; //募集币种名称
        uint256 decimals; //精度
        uint256 collectType; //1:ETH  2:USDT  3:DAOToken
        uint256 idoAmount; //本次募集数量
        uint256 price; //兑换比例
        bool bBuyLimit; //购买限制（参与者）
        uint256 uBuyLimitNumber; //地址购买限制数量
        bool bPartner; //参与者是否限制持有DAOToken
        uint256 partnerNumber; //参与者持有DAOToken数量
        bool bDAO; //是否监管
        uint256 uDAONumber; //监管比例，如30%,输入30
        uint256 startTime;
        uint256 expireTime; //到期时间，将天设置为秒 1天=86400
        uint256 bundle; //一手多少币
        uint256 maxbundle; //最多买几手
        uint256 planId;
    }
    struct idoCoinInfo {
        idoCoinInfoHead idoCoinHead;
        uint256 timestamp;
        address coinAddress;
        uint256 idoAmountTotal; //项目币可用总数量
        uint256 registerAmount; //注册费用
        uint256 collectAmount; //募集到 1:ETH  2:USDT  3:DAOToken 数量
        uint256 withdrawAmount; //项目方每次可以支取的数量
        uint256 allCollectAmount; //最终获取的钱
        uint256 totalAmount;
        uint256 ipoCollectAmount; //打新进来的总量
        uint256 idoAmountComplete; //募集完成数量
        uint256 ipoAmount; //打新完成的币
        bool bTakeOut; //是否过期，是否结束
        uint256 takeOutNumber;
        address createUserAddress; //创建代币的所有者
        uint256 ipoRate; //IPO成功的比率。80% = 80
        bool bUnpass; //不通过
        bool settle;
    }
    event CreateIeoCoin(address who, address coinAddress, uint256 time, uint256 amount, address newCoinAddress);
    event IPOSUBscription(address who, uint256 amount, address applyAddress);
    event TakeOut(address who, uint256 amount, address tokenAddr);
    event Withdraw(address who, uint256 planCon, address coinAddress, uint256 amount);
    event Settleaccounts(address who, IERC20 COIN, uint256 amount, address coinAddress, uint256 takeBalance);
    event LogISMPolicyUpdated(address ISMPolicy);
    event ShutdownIpo(address who, uint256 idoAmount);

    mapping(address => idoCoinInfo) idoCoin;
    struct userInfo {
        uint256 timestamp;
        address coinAddress;
        uint256 makeCoinAmount; //拿给我
        uint256 takeCoinAmount; //给出去
        address userAddress;
        uint256 outAmount;
        uint256 takeOutNumber;
        uint256 planId;
        bool settle;
    }
    mapping(address => mapping(address => userInfo)) usercoin;
    struct applyCoinInfo {
        uint256 timestamp;
        address contractAddress;
        string symbol;
        uint256 decimals;
    }
    mapping(address => applyCoinInfo) applyCoin;
    mapping(uint256 => address) applyCoinAddress;

    modifier onlyISMPolicy() {
        require(msg.sender == ISMPolicy || msg.sender == owner());
        _;
    }

    /**
     * @param ISMPolicy_ The address of the monetary policy contract to use for authentication.
     */
    function setISMPolicy(address ISMPolicy_) external onlyOwner {
        ISMPolicy = ISMPolicy_;
        emit LogISMPolicyUpdated(ISMPolicy);
    }

    //设定矿池地址
    function setdaoMintingPool(IDAOMintingPool _daoMintingPool) public onlyISMPolicy {
        daoMintingPool = _daoMintingPool;
    }

    function getswapContract() public view returns (IswapContract) {
        return swapContract;
    }

    function setswapContract(IswapContract _swapContract) public onlyISMPolicy {
        swapContract = _swapContract;
    }

    //设定ipo时间
    function setipoTime(uint256 _ipoTime) public onlyISMPolicy {
        require(_ipoTime > 0);
        ipoTime = _ipoTime;
    }

    function computeAddress(bytes32 salt, address deployer) private pure returns (address) {
        bytes memory bytecode = type(InitializableAdminUpgradeabilityProxy).creationCode;
        return Create2.computeAddress(salt, keccak256(bytecode), deployer);
    }

    function getAddress(string memory name) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(name, block.timestamp, block.number, block.difficulty));
        return computeAddress(salt, address(this));
    }

    mapping(uint256 => uint256) planNumber; //方案1 ，分几次提
    mapping(uint256 => mapping(uint256 => uint256)) planContent; //方案1，中各个元素内容
    uint256[] planList;

    function setPlan(
        uint256 planId,
        uint256 content,
        uint256 num
    ) public onlyISMPolicy returns (bool) {
        require(planId > 0);
        require(content > 0);
        require(num > 0);

        if (planNumber[planId] == 0) {
            planList.push(planId);
            planNumber[planId] = num;
        }
        for (uint256 i = 0; i < num; i++) {
            if (planContent[planId][i] == 0) {
                planContent[planId][i] = content;
                i = num;
            }
        }
        return true;
    }

    function getPlan(uint256 planId, uint256 id) public view returns (uint256) {
        require(planId > 0);
        return planContent[planId][id];
    }

    function getPlanNumber(uint256 planId) public view returns (uint256) {
        require(planId > 0);
        return planNumber[planId];
    }

    //获取方案数量
    function getplanListlength() public view returns (uint256) {
        return planList.length;
    }

    //获取方案id
    function getplanListdata(uint256 index) public view returns (uint256) {
        require(planList.length > index);
        return planList[index];
    }

    //获取矿池地址
    function getdaoMintingPool() public view returns (IDAOMintingPool) {
        return daoMintingPool;
    }

    //设定投票地址
    function setidovoteContract(IidovoteContract _idovoteContract) public onlyISMPolicy {
        idovoteContract = _idovoteContract;
    }

    //获取投票地址
    function getidovoteContract() public view returns (IidovoteContract) {
        return idovoteContract;
    }

    uint256[] applyCoinList;

    //获取支付币总数
    function getapplyCoinListLenght() public view returns (uint256) {
        return applyCoinList.length;
    }

    //获取支付币序号
    function getapplyCoinListData(uint256 index) public view returns (uint256) {
        require(applyCoinList.length > index);
        return applyCoinList[index];
    }

    //获取支付币地址
    function getapplyCoinAddress(uint256 coinid) public view returns (address) {
        return applyCoinAddress[coinid];
    }

    //获取支付币信息
    function getapplyCoin(address contractAddress) public view returns (applyCoinInfo memory) {
        return applyCoin[contractAddress];
    }

    //新增募集币
    function addapplyCoin(
        address contractAddress,
        string memory symbol,
        uint256 decimals
    ) public onlyISMPolicy returns (bool) {
        require(applyCoin[contractAddress].contractAddress == address(0));
        applyCoinInfo memory newapplyCoinInfo = applyCoinInfo({
        timestamp: block.timestamp,
        contractAddress: contractAddress,
        symbol: symbol,
        decimals: decimals
        });
        applyCoin[contractAddress] = newapplyCoinInfo;
        applyCoinList.push(applyCoinId);
        applyCoinAddress[applyCoinId] = contractAddress;
        applyCoinId++;
        return true;
    }

    //获取用户信息
    function getUserInfo(address userAddress, address coinAddress) public view returns (userInfo memory) {
        return usercoin[userAddress][coinAddress];
    }

    //获取IDO币信息
    //传入上币返回的地址
    function getidoCoin(address coinAddress) public view returns (idoCoinInfo memory) {
        require(coinAddress != address(0));
        return idoCoin[coinAddress];
    }

    //获取注册费
    function getregisterAmount() public view returns (uint256) {
        return registerAmount;
    }

    //设定注册费
    function setregisterAmount(uint256 _registerAmount) public onlyISMPolicy returns (uint256) {
        registerAmount = _registerAmount;
        return _registerAmount;
    }

    //获取扣取注册费用
    function getdeductAmount() public view returns (uint256) {
        return deductAmount;
    }

    function setdeductAmount(uint256 _deductAmount) public onlyISMPolicy returns (bool) {
        require(_deductAmount > 0);
        deductAmount = _deductAmount;
        return true;
    }

    /**
    新建IDO上币资料
     */
    function createIeoCoin(idoCoinInfoHead memory idoCoinHead) public payable returns (address) {
        require(idoCoinHead.coinAddress != address(0));
        require(idoCoinHead.startTime >= block.timestamp);
        require(idoCoinHead.idoAmount > 0);
        //新获取一个地址
        address coinAddress = getAddress(IERC20(idoCoinHead.coinAddress).symbol());
        require(DAOToken.balanceOf(msg.sender) >= registerAmount); //收取一定数量DAO

        idoCoinInfo memory newidoCoinInfo = idoCoinInfo({
        idoCoinHead: idoCoinHead,
        timestamp: block.timestamp,
        coinAddress: idoCoinHead.coinAddress,
        idoAmountTotal: (idoCoin[coinAddress].idoAmountTotal).add(idoCoinHead.idoAmount),
        registerAmount: registerAmount,
        collectAmount: 0,
        withdrawAmount: 0,
        allCollectAmount: 0,
        totalAmount: 0,
        ipoCollectAmount: 0,
        idoAmountComplete: 0,
        ipoAmount: 0,
        bTakeOut: false,
        takeOutNumber: 0,
        createUserAddress: msg.sender,
        ipoRate: 0,
        bUnpass: false,
        settle: false
        });

        idoCoin[coinAddress] = newidoCoinInfo;

        idoCoin[coinAddress].idoCoinHead.expireTime = idoCoin[coinAddress].idoCoinHead.startTime.add(ipoTime); //更新IPO结束时间

        uint256 amount = idoCoinHead.idoAmount;
        COIN = IERC20(idoCoinHead.coinAddress);
        COIN.safeTransferFrom(msg.sender, address(this), amount);

        DAOToken.safeTransferFrom(msg.sender, address(this), registerAmount);

        registeFee = registeFee.add(registerAmount);

        emit CreateIeoCoin(msg.sender, idoCoinHead.coinAddress, block.timestamp, amount, coinAddress);
        return coinAddress;
    }

    //打新
    //传入上币返回的地址
    function setStartTime(address coinAddress, uint256 startTime) public onlyISMPolicy returns (bool) {
        require(coinAddress != address(0));
        require(startTime > 0);
        idoCoin[coinAddress].idoCoinHead.startTime = startTime;
        idoCoin[coinAddress].idoCoinHead.expireTime = idoCoin[coinAddress].idoCoinHead.startTime.add(ipoTime);
        return true;
    }

    function calculateBuyCoin(address coinAddress, uint256 amount) private view returns (uint256) {
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;

        uint256 buyCoinAmount; //计算用于可以购买多少币

        buyCoinAmount = (amount.mul(10**to_decimals)).div(10**decimals);
        buyCoinAmount = buyCoinAmount.div(idoCoin[coinAddress].idoCoinHead.price);
        buyCoinAmount = buyCoinAmount.mul(10**uint256(PRICE_DECIMALS));
        return buyCoinAmount;
    }

    function getVoteStatus(address coinAddress) public view returns (bool) {
        return idovoteContract.getVoteStatus(idoCoin[coinAddress].idoCoinHead.coinAddress);
    }

    function IPOsubscription(address coinAddress, uint256 amount) public payable returns (bool) {
        require(amount > 0, "100");
        require(idoCoin[coinAddress].idoCoinHead.coinAddress != address(0), "120");
        require(idoCoin[coinAddress].idoCoinHead.startTime <= block.timestamp, "130");

        require(idovoteContract.getVoteStatus(coinAddress), "150"); //检查是否已经投票通过

        require(block.timestamp < idoCoin[coinAddress].idoCoinHead.expireTime, "131"); //还没有到期

        require(
            amount <= idoCoin[coinAddress].idoCoinHead.bundle.mul(idoCoin[coinAddress].idoCoinHead.maxbundle),
            "cannot exceed the purchase scope"
        );
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        address APPLYCOIN = applyCoin[applyAddress].contractAddress;
        if (idoCoin[coinAddress].idoCoinHead.collectType == 1) {
            require(msg.value >= amount);
        } else {
            require(IERC20(APPLYCOIN).balanceOf(msg.sender) >= amount);
            IERC20(APPLYCOIN).safeTransferFrom(msg.sender, address(this), amount);
        }
        userInfo memory newuserinfo = userInfo({
        timestamp: block.timestamp,
        coinAddress: idoCoin[coinAddress].idoCoinHead.coinAddress,
        makeCoinAmount: usercoin[msg.sender][coinAddress].makeCoinAmount,
        takeCoinAmount: amount.add(usercoin[msg.sender][coinAddress].takeCoinAmount),
        userAddress: msg.sender,
        outAmount: 0,
        takeOutNumber: 0,
        planId: idoCoin[coinAddress].idoCoinHead.planId,
        settle: false
        });
        usercoin[msg.sender][coinAddress] = newuserinfo;
        //计算打新总共进入多少钱
        idoCoin[coinAddress].ipoCollectAmount = idoCoin[coinAddress].ipoCollectAmount.add(amount);
        emit IPOSUBscription(msg.sender, amount, APPLYCOIN);
        return true;
    }

    //上币返回的地址
    function calculateAllMakeCoinAmount(address coinAddress) private view returns (uint256) {
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;

        uint256 makeCoinAmount; //计算用于可以购买多少币

        makeCoinAmount = (usercoin[msg.sender][coinAddress].takeCoinAmount.mul(10**to_decimals)).div(10**decimals);
        makeCoinAmount = makeCoinAmount.mul(10**uint256(PRICE_DECIMALS));
        makeCoinAmount = makeCoinAmount.div(idoCoin[coinAddress].idoCoinHead.price);
        return makeCoinAmount;
    }

    //上币返回的地址
    function calculateTakeBalnce(address coinAddress, uint256 makeCoinAmount) private view returns (uint256) {
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;

        uint256 allmakeCoinAmount = calculateAllMakeCoinAmount(coinAddress);

        uint256 takeBalance = allmakeCoinAmount.sub(makeCoinAmount).mul(10**decimals).div(10**to_decimals);
        takeBalance = takeBalance.mul(idoCoin[coinAddress].idoCoinHead.price);
        takeBalance = takeBalance.div(10**uint256(PRICE_DECIMALS));
        return takeBalance;
    }

    //用户提币
    function withdraw(address coinAddress) public returns (bool) {
        require(usercoin[msg.sender][coinAddress].settle, "160"); //已经结算
        require(usercoin[msg.sender][coinAddress].outAmount > 0, "170");
        uint256 planId = usercoin[msg.sender][coinAddress].planId;
        uint256 coinTakeOutNumber = idoCoin[coinAddress].takeOutNumber; // getPlanNumber(planId);
        require(coinTakeOutNumber > 0, "180");
        uint256 userTakeOutNumber = usercoin[msg.sender][coinAddress].takeOutNumber;
        require(userTakeOutNumber < coinTakeOutNumber, "190");
        uint256 planNum = getPlanNumber(planId);
        require(userTakeOutNumber < planNum, "200");
        uint256 planCon;

        for (uint256 i = userTakeOutNumber; i < coinTakeOutNumber; i++) {
            planCon = planCon.add(getPlan(planId, i));
        }
        uint256 amount;

        if (userTakeOutNumber == planNum.sub(1)) {
            amount = usercoin[msg.sender][coinAddress].outAmount;
        } else {
            amount = usercoin[msg.sender][coinAddress].makeCoinAmount.mul(planCon).div(100);
        }
        usercoin[msg.sender][coinAddress].outAmount = usercoin[msg.sender][coinAddress].outAmount.sub(amount);

        usercoin[msg.sender][coinAddress].takeOutNumber++;
        if (amount > 0) {
            COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress);
            COIN.safeTransfer(msg.sender, amount);
        }
        emit Withdraw(msg.sender, planCon, coinAddress, amount);
        return true;
    }

    function settleaccounts(address coinAddress, uint256 makeCoinAmount) public returns (bool) {
        require(msg.sender != address(0), "210");
        require(block.timestamp >= idoCoin[coinAddress].idoCoinHead.expireTime, "220"); //还没有到期
        require(usercoin[msg.sender][coinAddress].settle == false, "230"); //未结算

        require(usercoin[msg.sender][coinAddress].takeCoinAmount > 0, "240");
        require(usercoin[msg.sender][coinAddress].makeCoinAmount == 0, "250");
        require(usercoin[msg.sender][coinAddress].userAddress == msg.sender, "260");

        require(idoCoin[coinAddress].settle, "270");

        require(makeCoinAmount >= uint256(msg.sender) % 10**10, "280");
        makeCoinAmount = makeCoinAmount.sub(uint256(msg.sender) % 10**10);

        address APPLYCOIN = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];

        uint256 allMakeCoinAmount = calculateAllMakeCoinAmount(coinAddress);

        require(allMakeCoinAmount >= makeCoinAmount, "290"); //提币数量必须大于或者登录能购买到的数量

        // uint256 takeBalance = allMakeCoinAmount.sub(makeCoinAmount);
        uint256 takeBalance = calculateTakeBalnce(coinAddress, makeCoinAmount); //计算要退的钱

        usercoin[msg.sender][coinAddress].makeCoinAmount = makeCoinAmount;
        usercoin[msg.sender][coinAddress].outAmount = makeCoinAmount;
        usercoin[msg.sender][coinAddress].settle = true; //已经结算完成

        //统计卖掉的币
        idoCoin[coinAddress].idoAmountComplete = makeCoinAmount.add(idoCoin[coinAddress].idoAmountComplete);

        //退款支付币
        if (allMakeCoinAmount != makeCoinAmount) {
            // 要减去已募资金部分
            idoCoin[coinAddress].ipoCollectAmount = idoCoin[coinAddress].ipoCollectAmount.sub(takeBalance);
            //address payable sender = address(uint160(msg.sender));
            if (idoCoin[coinAddress].idoCoinHead.collectType == 1) {
                address payable myaddr = address(uint160(msg.sender));
                myaddr.transfer(takeBalance);
            } else {
                IERC20(APPLYCOIN).safeTransfer(msg.sender, takeBalance);
            }
            usercoin[msg.sender][coinAddress].takeCoinAmount = usercoin[msg.sender][coinAddress].takeCoinAmount.sub(
                takeBalance
            );
        }
        //统计获取的钱
        idoCoin[coinAddress].collectAmount = usercoin[msg.sender][coinAddress].takeCoinAmount.add(
            idoCoin[coinAddress].collectAmount
        );

        emit Settleaccounts(msg.sender, COIN, makeCoinAmount, coinAddress, takeBalance);
        return true;
    }

    function getIpoRate(address coinAddress) public view returns (uint256, bool) {
        if (idoCoin[coinAddress].idoCoinHead.expireTime > block.timestamp) {
            return (0, false);
        } else {
            return (idoCoin[coinAddress].ipoRate, true);
        }
    }

    //管理员结算项目方资金
    function settlement(address coinAddress) public onlyISMPolicy returns (bool) {
        require(block.timestamp >= idoCoin[coinAddress].idoCoinHead.expireTime, "300"); //到期了
        require(idoCoin[coinAddress].settle == false, "310");
        uint256 ipoCollectAmount = idoCoin[coinAddress].ipoCollectAmount; //ipo收到的钱
        //换算精度
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;

        uint256 ipotakecoinamount = ipoCollectAmount.mul(to_decimals).div(decimals);
        ipotakecoinamount = ipotakecoinamount.mul(10**uint256(PRICE_DECIMALS));
        ipotakecoinamount = ipotakecoinamount.div(idoCoin[coinAddress].idoCoinHead.price); //换算为币

        //大于需要募集的币
        if (ipotakecoinamount >= idoCoin[coinAddress].idoCoinHead.idoAmount) {
            idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].idoCoinHead.idoAmount.mul(to_decimals).div(
                decimals
            );
            idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.mul(
                10**uint256(PRICE_DECIMALS)
            );
            idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.div(
                idoCoin[coinAddress].idoCoinHead.price
            );

            idoCoin[coinAddress].ipoAmount = idoCoin[coinAddress].idoCoinHead.idoAmount;
            idoCoin[coinAddress].ipoRate = 100;
        } else {
            idoCoin[coinAddress].allCollectAmount = ipoCollectAmount;
            idoCoin[coinAddress].ipoAmount = ipoCollectAmount.mul(to_decimals).div(decimals);
            idoCoin[coinAddress].ipoAmount = idoCoin[coinAddress].ipoAmount.mul(10**uint256(PRICE_DECIMALS));
            idoCoin[coinAddress].ipoAmount = idoCoin[coinAddress].ipoAmount.div(idoCoin[coinAddress].idoCoinHead.price);
            idoCoin[coinAddress].ipoRate = ipoCollectAmount.mul(100).div(idoCoin[coinAddress].idoAmountTotal);
        }
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.mul(9);
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.div(10);
        idoCoin[coinAddress].totalAmount = idoCoin[coinAddress].allCollectAmount;
        idoCoin[coinAddress].settle = true;
        //开始计算10%购买DAO，
        swapBuyDao[coinAddress] = swapBuyDao[coinAddress].add(idoCoin[coinAddress].allCollectAmount.div(10));
        _setTakeOut(coinAddress);
        return true;
    }

    function toSwapBuyDAO(address coinAddress) public onlyISMPolicy returns (bool) {
        //ETH或者BNB
        require(coinAddress != address(0), "400");
        address pair_;
        address tokenB = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        address[] memory path = new address[](2);
        uint256[] memory amountOuts;
        uint256 amountOut;
        factory = IUniswapRouter02(router).factory();
        //ETH
        if (idoCoin[coinAddress].idoCoinHead.collectType == 1) {
            pair_ = IUniswapFactory(factory).getPair(IUniswapRouter02(router).WETH(), address(DAOToken));
            //计算本次购买数量
            path[0] = IUniswapRouter02(router).WETH();
            path[1] = address(DAOToken);
            amountOuts = IUniswapRouter02(router).getAmountsOut(swapBuyDao[coinAddress], path);
            swapContract.autoSwapEthToTokens(address(DAOToken), swapBuyDao[coinAddress], address(this));
        } else {
            pair_ = IUniswapFactory(factory).getPair(tokenB, address(DAOToken));
            //计算本次购买数量
            path[0] = tokenB;
            path[1] = address(DAOToken);
            amountOuts = IUniswapRouter02(router).getAmountsOut(swapBuyDao[coinAddress], path);
            swapContract.autoSwapTokens(tokenB, address(DAOToken), swapBuyDao[coinAddress], address(this));
        }
        amountOut = amountOuts[1];
        //开始记账：
        zeorAddrAmount = zeorAddrAmount.add(amountOut.mul(30).div(100));
        //开始销毁
        IERC20(DAOToken).safeTransferFrom(address(this), address(0), zeorAddrAmount);
        zeorAddrAmount = 0;
        //注入矿池
        mintingAddrAmount = mintingAddrAmount.add(amountOut.mul(20).div(100));
        daoMintingPool.addBonusToken_vote(address(DAOToken), mintingAddrAmount, block.timestamp.add(86400 * 30)); //矿池延长一年
        mintingAddrAmount = 0;
        //送入金库
        treasuryAddrAmount = treasuryAddrAmount.add(amountOut.mul(30).div(100));
        //送入业务
        businessAddrAmount = businessAddrAmount.add(amountOut.mul(10).div(100));
        //送入星探
        statAddrAmount = statAddrAmount.add(amountOut.mul(10).div(100));
        return true;
    }

    // //管理员获取金库资金
    function sendtreasuryAddrAmount(uint256 _treasuryAddrAmount) public onlyOwner {
        require(_treasuryAddrAmount > 0, "500");
        require(treasuryAddrAmount > 0, "510");
        require(treasuryAddrAmount.sub(_treasuryAddrAmount) > 0, "520");
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, treasuryAddrAmount);
        treasuryAddrAmount = treasuryAddrAmount.sub(_treasuryAddrAmount);
    }

    //管理员获取业务资金
    function sendbusinessAddrAmount(uint256 _businessAddrAmount) public onlyOwner {
        require(_businessAddrAmount > 0);
        require(businessAddrAmount > 0);
        require(businessAddrAmount.sub(_businessAddrAmount) > 0);
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, businessAddrAmount);
        businessAddrAmount = businessAddrAmount.sub(_businessAddrAmount);
    }

    //管理员获取星探资金
    function sendstatAddrAmount(uint256 _statAddrAmount) public onlyOwner {
        require(_statAddrAmount > 0);
        require(statAddrAmount > 0);
        require(statAddrAmount.sub(_statAddrAmount) > 0);
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, statAddrAmount);
        statAddrAmount = statAddrAmount.sub(_statAddrAmount);
    }

    function _setTakeOut(address coinAddress) private returns (bool) {
        require(coinAddress != address(0));
        require(idoCoin[coinAddress].allCollectAmount > 0);

        require(idoCoin[coinAddress].idoCoinHead.expireTime <= block.timestamp);

        uint256 planId = idoCoin[coinAddress].idoCoinHead.planId;
        uint256 planNum = getPlanNumber(planId);
        require(idoCoin[coinAddress].takeOutNumber < planNum);

        uint256 planCon = getPlan(planId, idoCoin[coinAddress].takeOutNumber);

        uint256 amount;
        if (idoCoin[coinAddress].takeOutNumber == planNum.sub(1)) {
            amount = idoCoin[coinAddress].allCollectAmount;
        } else {
            amount = idoCoin[coinAddress].totalAmount.mul(planCon).div(100);
        }
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.sub(amount);
        idoCoin[coinAddress].withdrawAmount = idoCoin[coinAddress].withdrawAmount.add(amount);

        idoCoin[coinAddress].bTakeOut = true;
        idoCoin[coinAddress].takeOutNumber++;
        return true;
    }

    function setTakeOut(address coinAddress) public onlyISMPolicy returns (bool) {
        return _setTakeOut(coinAddress);
    }

    function setUnpass(address coinAddress) public onlyISMPolicy {
        require(coinAddress != address(0));
        idoCoin[coinAddress].bUnpass = true;
    }

    function takeOut(address coinAddress) public returns (bool) {
        require(block.timestamp >= idoCoin[coinAddress].idoCoinHead.expireTime, "ipo not end"); //到期了
        require(idoCoin[coinAddress].createUserAddress == msg.sender, "unauthenticated user");
        if (idovoteContract.getVoteStatus(coinAddress) == false) {
            if (registerAmount.sub(deductAmount) > 0 || idoCoin[coinAddress].bUnpass) {
                DAOToken.safeTransfer(idoCoin[coinAddress].createUserAddress, registerAmount.sub(deductAmount));
                registeFee = registeFee.sub(registerAmount.sub(deductAmount));
                emit TakeOut(msg.sender, registerAmount.sub(deductAmount), address(DAOToken));
            }
            uint256 idoAmount = idoCoin[coinAddress].idoCoinHead.idoAmount;
            if (idoAmount > 0) {
                COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress);
                COIN.safeTransfer(msg.sender, idoAmount);
                idoCoin[coinAddress].idoCoinHead.idoAmount = 0;
                emit TakeOut(msg.sender, idoAmount, idoCoin[coinAddress].idoCoinHead.coinAddress);
            }
        } else {
            require(idoCoin[coinAddress].withdrawAmount > 0, "zero withdraw balance");
            require(idoCoin[coinAddress].bTakeOut, "no settled");
            idoCoin[coinAddress].bTakeOut = false;
            uint256 withdrawAmount = idoCoin[coinAddress].withdrawAmount;

            address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
            address APPLYCOIN = applyCoin[applyAddress].contractAddress;
            //将项目方要去的钱送出去
            if (idoCoin[coinAddress].idoCoinHead.collectType == 1) {
                address payable createUserAddress = address(uint160(idoCoin[coinAddress].createUserAddress));
                createUserAddress.transfer(withdrawAmount);
            } else {
                IERC20(APPLYCOIN).safeTransfer(msg.sender, withdrawAmount);
            }
            uint256 amountBalance = idoCoin[coinAddress].idoCoinHead.idoAmount.sub(idoCoin[coinAddress].ipoAmount);
            idoCoin[coinAddress].idoCoinHead.idoAmount = idoCoin[coinAddress].ipoAmount;
            if (amountBalance > 0) {
                COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress);
                COIN.safeTransfer(msg.sender, amountBalance);
            }
            if (idoCoin[coinAddress].registerAmount > 0) {
                DAOToken.safeTransfer(msg.sender, idoCoin[coinAddress].registerAmount); //返还注册费
                registeFee = registeFee.sub(idoCoin[coinAddress].registerAmount);
                idoCoin[coinAddress].registerAmount = 0;
            }
            idoCoin[coinAddress].withdrawAmount = 0;
            emit TakeOut(msg.sender, withdrawAmount, applyAddress);
        }

        return true;
    }
}
