// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import './IERC20.sol';
import './SafeMath.sol';
import "./SafeERC20.sol";

import "./IUniswapFactory.sol";
import "./IUniswapPair.sol";
import "./IUniswapRouter02.sol";


interface IDAOMintingPool {
    function getuserTotalVeDao(address who) external view returns(uint256); //获取用户总抵押veDao
    function getcalculatestakingAmount() external view returns(uint256);  //获取矿池总抵押veDaO
    function getuserTotalDao(address who,address lpToken) external view returns(uint256); //获取用户抵押的DAO总量
    function getpoolStakingTotal(address lpToken) external view returns(uint256); //获取矿池总抵押dao
    function addBonusToken_vote(address bsToken,uint256 amount,uint256 expirationTimestamps) external returns(bool);  //合约调价矿池

}
interface IidovoteContract{
    function getVoteStatus(address coinAddress) external view returns(bool);
}
/*
 * 上币 合约 
*/
contract idoCoinContract is  Ownable {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    uint        public priceDecimals;      
    uint256     public registerAmount;
    uint8       private TOKEN_DECIMALS; 
    uint8       private PRICE_DECIMALS;
    IERC20      public COIN;
    IERC20      public DAOToken;
    IDAOMintingPool  public daoMintingPool;
    IidovoteContract public idovoteContract;
    
    uint        applyCoinId;
    address     public daoAddress;
    uint256     public registeFee;

    mapping(address=> uint256)  swapBuyDao;

    address public router;
    address public factory;
    //分配机制
    uint256     public zeorAddrAmount;       //黑洞地址  30%
    uint256     public mintingAddrAmount;    //矿池地址  20%
    uint256     public treasuryAddrAmount;   //金库地址  30%
    uint256     public businessAddrAmount;     //业务经理 10%
    uint256     public statAddrAmount;         //星探  10%
    address     WETH;
    constructor(
        IERC20 _DAOToken,
        IDAOMintingPool _IDAOMintingPool,
        IidovoteContract _IidovoteContract,
        address router_) {
            
        initializeOwner();
        
        daoMintingPool = _IDAOMintingPool;
        idovoteContract = _IidovoteContract;
        DAOToken            = _DAOToken;
        priceDecimals   = 4;
        TOKEN_DECIMALS  = 18;
        PRICE_DECIMALS  = 6;
        registerAmount  = 1 * (10 ** uint256(TOKEN_DECIMALS));
        applyCoinId     = 1;
        addapplyCoin(msg.sender ,"ETH",18);          
        registeFee      = 0;
        _owner          = msg.sender;
        router          = router_;
        zeorAddrAmount  = 0;
        mintingAddrAmount = 0;
        treasuryAddrAmount = 0;
        businessAddrAmount = 0;
        statAddrAmount = 0;
    }
    
    struct idoCoinInfoHead{
        address     coinAddress;         //募集币种地址
        string      symbol;              //募集币种名称
        uint        decimals;            //精度   
        uint        collectType;         //1:ETH  2:USDT  3:DAOToken      
        uint256     idoAmount;           //本次募集数量        
        uint256     price;               //兑换比例
        bool        bBuyLimit;           //购买限制（参与者）
        uint256     uBuyLimitNumber;     //地址购买限制数量
        bool        bPartner;            //参与者是否限制持有DAOToken
        uint256     partnerNumber;       //参与者持有DAOToken数量
        bool        bDAO;                //是否监管
        uint256     uDAONumber;          //监管比例，如30%,输入30
        uint        expireTime;          //到期时间，将天设置为秒 1天=86400

    }
    struct idoCoinInfo{
        idoCoinInfoHead idoCoinHead; 
        uint        timestamp;          
        address     coinAddress;
        uint256     idoAmountTotal;      //募集总数量 
        uint256     registerAmount;      //注册费用
        uint256     collectAmount;       //募集到 1:ETH  2:USDT  3:DAOToken 数量

        uint256     withdrawAmount;      //项目方每次可以支取的数量
        
        uint256     allCollectAmount;    //最终获取的钱
        uint256     ipoCollectAmount;    //打新进来的总量    
        
        uint256     idoAmountComplete;   //募集完成数量

        uint256     ipoAmount;          //打新完成的币

        bool        bTakeOut;           //是否过期，是否结束
        address     createUserAddress;  //创建代币的所有者 
    }
    event CreateIeoCoin(address who,address coinAddress,uint time,uint256 amount);
    event IPOSUBscription(address who,uint256 amount,address applyAddress);
    event TakeOut(address who,uint256 amount,uint collectType ) ;
    event Withdraw(address who,IERC20 COIN,uint256 amount ,address coinAddress,uint256 takeBalance);

    mapping(address=>idoCoinInfo) idoCoin;                  
    struct userInfo{
        uint256        timestamp;          
        address     coinAddress;         
        uint256     makeCoinAmount;   //拿给我   
        uint256     takeCoinAmount;   //给出去   
        address     userAddress;
    }
    mapping(address=> mapping(address=> userInfo)) usercoin;
    struct applyCoinInfo{
        uint256        timestamp;
        address     contractAddress;
        string      symbol;
        uint256        decimals;
    }
    mapping(address => applyCoinInfo) applyCoin;
    mapping(uint256 => address) applyCoinAddress;
    //swap交换ERC20
    function autoSwapTokens(
        address token0, 
        address token1, 
        uint256 amountIn, 
        address to 
    ) private {
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;
        IERC20(token0).approve(router, amountIn);
        IUniswapRouter02(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            0,
            path,
            to,
            block.timestamp.add(600)
        );
    }
    //swap交换 ETH/BNB 
    function autoSwapEthToTokens(
        address token, 
        uint256 amountIn, 
        address to
    ) private {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);

        path[0] = IUniswapRouter02(router).WETH();
        path[1] = token;

        // make the swap
        IUniswapRouter02(router).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountIn,
            path,
            to,
            block.timestamp.add(600)
        );
    }
    //设定矿池地址
    function setdaoMintingPool(IDAOMintingPool _daoMintingPool) public onlyOwner {
        daoMintingPool = _daoMintingPool;
    }
    //获取矿池地址
    function getdaoMintingPool() public view returns(IDAOMintingPool){
        return daoMintingPool;
    } 
    //设定投票地址
    function setidovoteContract(IidovoteContract _idovoteContract) public onlyOwner{
        idovoteContract = _idovoteContract;
    }
    //获取投票地址
    function getidovoteContract() public view returns(IidovoteContract){
        return idovoteContract;
    }

    uint256 [] applyCoinList;
    //获取支付币总数
    function getapplyCoinListLenght() public view returns(uint256){
        return applyCoinList.length;
    }
    //获取支付币序号
    function getapplyCoinListData(uint index) public view returns(uint256){
        require(applyCoinList.length > index);
        return applyCoinList[index];
    }
    //获取支付币地址
    function getapplyCoinAddress(uint256 coinid) public view returns(address){
        return applyCoinAddress[coinid];
    }
    //获取支付币信息
    function getapplyCoin(address contractAddress) public view returns(applyCoinInfo memory){
        return applyCoin[contractAddress];
    }
    //新增募集币
    function addapplyCoin(address contractAddress,string memory symbol,uint decimals) public onlyOwner returns(bool){
        require(applyCoin[contractAddress].contractAddress == address(0));   
        applyCoinInfo memory newapplyCoinInfo = applyCoinInfo({
            timestamp:         block.timestamp,
            contractAddress:    contractAddress,
            symbol:             symbol,
            decimals:           decimals                   
        });
        applyCoin[contractAddress] = newapplyCoinInfo;
        applyCoinList.push(applyCoinId);
        applyCoinAddress[applyCoinId] = contractAddress;
        applyCoinId++;
        return true;
    }
    //获取用户信息
    function getUserInfo(address userAddress,address coinAddress) public view returns(userInfo memory){
        return usercoin[userAddress][coinAddress];
    }
    //获取IDO币信息
    function getidoCoin( address coinAddress ) public view returns(idoCoinInfo memory){
        require( coinAddress != address(0) );           
        return idoCoin[coinAddress];
    }
    //获取注册费
    function getregisterAmount() public view returns(uint256){
        return registerAmount;
    }
    //设定注册费
    function setregisterAmount(uint256 _registerAmount) public onlyOwner returns(uint256){
        registerAmount = _registerAmount;
        return _registerAmount;
    }
    /**
    新建IDO上币资料
     */
    function createIeoCoin(idoCoinInfoHead memory idoCoinHead) public payable returns(bool){
        require(idoCoinHead.coinAddress != address(0));
        
        require(idoCoinHead.idoAmount > 0);
        address coinAddress = idoCoinHead.coinAddress;
       

        require(idoCoin[coinAddress].idoCoinHead.coinAddress == address(0));  
        //require(msg.value >=  registerAmount );         //收取至少一个ETH 
        require(DAOToken.balanceOf(msg.sender) >= registerAmount);       //收取一定数量DAO 
      
        idoCoinInfo memory newidoCoinInfo = idoCoinInfo({
            idoCoinHead:            idoCoinHead,
            timestamp:              block.timestamp,
            coinAddress:            coinAddress,
            idoAmountTotal:         (idoCoin[coinAddress].idoAmountTotal).add(idoCoinHead.idoAmount), 
            registerAmount:         msg.value,
            collectAmount:          0,
            withdrawAmount:         0,
            allCollectAmount:       0,
            ipoCollectAmount:       0,
            idoAmountComplete:      0,
            ipoAmount:              0,
            bTakeOut:               false,
            createUserAddress:      msg.sender
            
        });
        
        idoCoin[coinAddress]  = newidoCoinInfo;        
        idoCoin[coinAddress].coinAddress = coinAddress;

        uint256 amount = idoCoinHead.idoAmount ;
        COIN =  IERC20(idoCoinHead.coinAddress) ;
        COIN.safeTransferFrom(msg.sender, address(this), amount);
        
        DAOToken.safeTransferFrom(msg.sender, address(this),registerAmount);

        registeFee = registeFee.add(msg.value);

        emit CreateIeoCoin(msg.sender,idoCoinHead.coinAddress,block.timestamp,amount);      
        return true;
    }
    //打新
    function IPOsubscription(address coinAddress,uint256 amount) public payable returns(bool){
        require(idoCoin[coinAddress].idoCoinHead.coinAddress != address(0));
        
        require(idovoteContract.getVoteStatus(coinAddress));  //检查是否已经投票通过
        
        require(block.timestamp < idoCoin[coinAddress].idoCoinHead.expireTime); //还没有到期
        
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        address APPLYCOIN  = applyCoin[applyAddress].contractAddress ; 
        address payable myOwner = address(uint160(_owner));
        if(idoCoin[coinAddress].idoCoinHead.collectType == 1){                                        
            require(msg.value >= amount );  
            myOwner.transfer(amount);                        
        }
        else{
            require(IERC20(APPLYCOIN).balanceOf(msg.sender) >= amount);
            IERC20(APPLYCOIN).safeTransferFrom(msg.sender, address(this), amount);      
        }
        userInfo memory newuserinfo = userInfo({
            timestamp:          block.timestamp,
            coinAddress:        coinAddress,
            makeCoinAmount:     usercoin[msg.sender][coinAddress].makeCoinAmount,   
            takeCoinAmount:     amount.add(usercoin[msg.sender][coinAddress].takeCoinAmount),          
            userAddress:        msg.sender
        });
        usercoin[msg.sender][coinAddress] = newuserinfo;
        //计算打新总共进入多少钱
        idoCoin[coinAddress].ipoCollectAmount = idoCoin[coinAddress].ipoCollectAmount.add(amount);
        emit IPOSUBscription(msg.sender,amount,APPLYCOIN);        
        return true;

    }
 
    function calculateAllMakeCoinAmount(address coinAddress ) private view returns(uint256){
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;              
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;                                  
        
        uint256 makeCoinAmount;  //计算用于可以购买多少币    

        makeCoinAmount = (usercoin[msg.sender][coinAddress].takeCoinAmount.mul(10 ** to_decimals)).div(10 ** decimals);
        makeCoinAmount = makeCoinAmount.mul( idoCoin[coinAddress].idoCoinHead.price );
        makeCoinAmount = makeCoinAmount.div(10 ** uint256(PRICE_DECIMALS)); 
        makeCoinAmount = makeCoinAmount.div(1e4);//除以10的4次方
        return makeCoinAmount;
    }
 
    function calculateTakeBalnce(address coinAddress,uint256 makeCoinAmount) private view returns(uint256){
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;              
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;   

        uint256 allmakeCoinAmount = calculateAllMakeCoinAmount(coinAddress);

        uint256 takeBalance = allmakeCoinAmount.sub(makeCoinAmount).mul(10 ** decimals).div(10 ** to_decimals); 
        takeBalance = takeBalance.div(PRICE_DECIMALS); 
        takeBalance = takeBalance.div(1e4);
        return takeBalance;
    }
    function checkwinningRate(uint256 winningRate) private pure returns(bool){
        uint256 temp = winningRate.div(1e8);
        if(temp >= 0 && temp <=100){
            return true;
        }else{
            return false;
        }
    }
    //用户提币
    //winningRate 放大10^10次方  winningRate = winningRate.div(1e10) 必须在0--1之间
    //用户推广返佣
    // 比例取整后，给客户
    // makeCoinAmount = userAddress % 10 **10 + amount 
    function withdraw(address coinAddress,uint256 winningRate,uint256 makeCoinAmount) public returns(bool){
        require(msg.sender != address(0));
        require(usercoin[msg.sender][coinAddress].takeCoinAmount > 0);

        require(usercoin[msg.sender][coinAddress].userAddress == msg.sender);

        require(checkwinningRate(winningRate));

        makeCoinAmount = makeCoinAmount.sub(uint256(msg.sender) % 10 ** 10);        

        address APPLYCOIN = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        
        uint256 allMakeCoinAmount = calculateAllMakeCoinAmount(coinAddress);
        
        require(allMakeCoinAmount >= makeCoinAmount); //提币数量必须大于或者登录能购买到的数量

        uint256 takeBalance = calculateTakeBalnce(coinAddress,makeCoinAmount) ; //计算要退的钱

        usercoin[msg.sender][coinAddress].makeCoinAmount =  makeCoinAmount;
        //提取购买币
        COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress);   
        COIN.safeTransfer(msg.sender,makeCoinAmount );

        
        //统计卖掉的币
        idoCoin[coinAddress].idoAmountComplete = makeCoinAmount.add(idoCoin[coinAddress].idoAmountComplete);   

        //退款支付币
        if( allMakeCoinAmount != makeCoinAmount ){
            //address payable sender = address(uint160(msg.sender));
            if(idoCoin[coinAddress].idoCoinHead.collectType == 1){
                address(uint160(msg.sender)).transfer(takeBalance); 
            }else{
                IERC20(APPLYCOIN).safeTransfer(msg.sender, takeBalance);       
            }
            usercoin[msg.sender][coinAddress].takeCoinAmount = usercoin[msg.sender][coinAddress].takeCoinAmount.sub(takeBalance);
        }
        //统计获取的钱
        idoCoin[coinAddress].collectAmount = usercoin[msg.sender][coinAddress].takeCoinAmount.add(idoCoin[coinAddress].collectAmount);

        emit Withdraw(msg.sender,COIN, makeCoinAmount,coinAddress,takeBalance );
        return true;
    }
    
    //管理员结算项目方资金
    function settlement(address coinAddress) public onlyOwner returns(bool){
        require(block.timestamp >= idoCoin[coinAddress].idoCoinHead.expireTime); //到期了
        uint256 ipoCollectAmount = idoCoin[coinAddress].ipoCollectAmount;   //ipo收到的钱
        //换算精度
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;              
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;   

        uint256 ipotakecoinamount = ipoCollectAmount.mul(to_decimals).div(decimals); 
        ipotakecoinamount = ipotakecoinamount.mul((1e4));
        ipotakecoinamount = ipoCollectAmount.div(idoCoin[coinAddress].idoCoinHead.price);  //换算为币

        if(ipotakecoinamount >= idoCoin[coinAddress].idoCoinHead.idoAmount) //大于需要募集的币
        {
           idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].idoCoinHead.idoAmount.mul(to_decimals).div(decimals);
           idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.mul(1e4);
           idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.div(idoCoin[coinAddress].idoCoinHead.price);

           idoCoin[coinAddress].ipoAmount = idoCoin[coinAddress].idoCoinHead.idoAmount;

        }
        else{
           idoCoin[coinAddress].allCollectAmount =  ipoCollectAmount;
           idoCoin[coinAddress].ipoAmount = ipoCollectAmount.mul(to_decimals).div(decimals);
           idoCoin[coinAddress].ipoAmount = idoCoin[coinAddress].ipoAmount.mul(1e4);  
           idoCoin[coinAddress].ipoAmount = ipoCollectAmount.div(idoCoin[coinAddress].idoCoinHead.price);
        }
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.mul(9);
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.div(10);
        //开始计算10%购买DAO，
        swapBuyDao[coinAddress] = swapBuyDao[coinAddress].add( idoCoin[coinAddress].allCollectAmount.div(10) ); 
        return true;
    }
   
    //去swap上购币
    //代币 coinAddress,交易对tokenB,如果交易对是 ETH，那么传WETH地址，否则传交易对地址
    function toSwapBuyDAO(address coinAddress) public onlyOwner returns(bool){
        //ETH或者BNB
        require(coinAddress != address(0));
        uint256 reserve0;
        uint256 reserve1;
        uint256 amountOut;
        address pair_ ;
        address tokenB = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        factory = IUniswapRouter02(router).factory();
         //获取储量
        ( reserve0,  reserve1, ) = IUniswapPair(pair_).getReserves();
        //计算本次购买数量    
        amountOut = IUniswapRouter02(router).getAmountOut(
            swapBuyDao[coinAddress],
            reserve0,
            reserve1
            );
        if( idoCoin[coinAddress].idoCoinHead.collectType  == 1 ) //ETH
        {
            pair_= IUniswapFactory(factory).getPair(IUniswapRouter02(router).WETH(),address(DAOToken));
            autoSwapEthToTokens(
                address(DAOToken),
                swapBuyDao[coinAddress],
                address(this)
                );
        }
        else{
            pair_= IUniswapFactory(factory).getPair(tokenB,address(DAOToken));
            autoSwapTokens(
                tokenB,
                address(DAOToken),
                swapBuyDao[coinAddress],
                address(this)
            );
        
        }
       
        //开始记账：
       zeorAddrAmount = zeorAddrAmount.add(amountOut.mul(30).div(100));
       //开始销毁
       IERC20(DAOToken).safeTransferFrom(address(this), address(0), zeorAddrAmount);      
       zeorAddrAmount = 0;  
       //注入矿池    
       mintingAddrAmount = mintingAddrAmount.add(amountOut.mul(20).div(100));
       daoMintingPool.addBonusToken_vote(address(DAOToken),mintingAddrAmount,block.timestamp.add(86400 * 30)); //矿池延长一年
       mintingAddrAmount = 0; 
       //送入金库
       treasuryAddrAmount = treasuryAddrAmount.add(amountOut.mul(30).div(100));
       //送入业务
       businessAddrAmount = businessAddrAmount.add(amountOut.mul(10).div(100));
       //送入星探
       statAddrAmount = statAddrAmount.add(amountOut.mul(10).div(100));
       return true;
    }
    //管理员获取金库资金
    function sendtreasuryAddrAmount(uint256 _treasuryAddrAmount) public onlyOwner {
        require(_treasuryAddrAmount>0);
        require(treasuryAddrAmount > 0);
        require(treasuryAddrAmount.sub(_treasuryAddrAmount)>0);    
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, treasuryAddrAmount);
        treasuryAddrAmount = treasuryAddrAmount.sub(_treasuryAddrAmount);
    }
    //管理员获取业务资金
    function sendbusinessAddrAmount(uint256 _businessAddrAmount) public onlyOwner{
        require(_businessAddrAmount>0);
        require(businessAddrAmount > 0);
        require(businessAddrAmount.sub(_businessAddrAmount)>0);    
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, businessAddrAmount);
        businessAddrAmount = businessAddrAmount.sub(_businessAddrAmount);
    }
    //管理员获取星探资金
    function sendstatAddrAmount(uint256 _statAddrAmount) public onlyOwner{
        require(_statAddrAmount>0);
        require(statAddrAmount > 0);
        require(statAddrAmount.sub(_statAddrAmount)>0);    
        IERC20(DAOToken).safeTransferFrom(address(this), msg.sender, statAddrAmount);
        statAddrAmount = statAddrAmount.sub(_statAddrAmount);
    }
    //分几次提币，每次按百分比提，管理员管理是否可以提币 2022-05-17
    //管理员在结束的时候，统计一下项目方卖币数量2022-05-17


    //管理员设定项目方提币数量
    function setTakeOut(address coinAddress,uint256 amount) public onlyOwner returns(bool){
        require(amount>=0);
        require(idoCoin[coinAddress].allCollectAmount >= amount);
        idoCoin[coinAddress].allCollectAmount = idoCoin[coinAddress].allCollectAmount.sub(amount);
        idoCoin[coinAddress].withdrawAmount = amount;
        
        idoCoin[coinAddress].bTakeOut = true;
        return true;
    }
    //项目方提币
    function takeOut( address coinAddress) public returns(bool){
        require(block.timestamp >= idoCoin[coinAddress].idoCoinHead.expireTime); //到期了
        require(idoCoin[coinAddress].createUserAddress == msg.sender ); 
        require(idoCoin[coinAddress].withdrawAmount>0);
        require(idoCoin[coinAddress].bTakeOut); 
        idoCoin[coinAddress].bTakeOut = false;
        uint256 withdrawAmount = idoCoin[coinAddress].withdrawAmount;

        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        address APPLYCOIN  = applyCoin[applyAddress].contractAddress ;
        //将项目方要去的钱送出去     
        if( idoCoin[coinAddress].idoCoinHead.collectType == 1 ){
            address payable createUserAddress = address(uint160(idoCoin[coinAddress].createUserAddress));
            createUserAddress.transfer(withdrawAmount); 
        }
        else{
            IERC20(APPLYCOIN).safeTransfer(msg.sender,withdrawAmount);    
        }
        uint256 amountBalance = idoCoin[coinAddress].idoCoinHead.idoAmount.sub(idoCoin[coinAddress].ipoAmount);
        idoCoin[coinAddress].idoCoinHead.idoAmount = idoCoin[coinAddress].ipoAmount;
        if( amountBalance >0 ){
            COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress); 
            COIN.safeTransfer(msg.sender, amountBalance);  
        }
        if( idoCoin[coinAddress].registerAmount > 0 ){
            DAOToken.safeTransfer(msg.sender, idoCoin[coinAddress].registerAmount );  //返还注册费
            idoCoin[coinAddress].registerAmount = 0;
        }
        emit TakeOut(msg.sender,withdrawAmount,idoCoin[coinAddress].idoCoinHead.collectType);
        return true;
    }
     
  
 }