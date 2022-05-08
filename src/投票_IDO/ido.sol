// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import './IERC20.sol';
import './SafeMath.sol';
import "./SafeERC20.sol";

interface IDAOMintingPool {
    function getuserTotalVeDao(address who) external view returns(uint256); //获取用户总抵押veDao
    function getcalculatestakingAmount() external view returns(uint256);  //获取矿池总抵押veDaO
    function getuserTotalDao(address who,address lpToken) external view returns(uint256); //获取用户抵押的DAO总量
    function getpoolStakingTotal(address lpToken) external view returns(uint256); //获取矿池总抵押dao
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

    
    uint256     private fee;
    uint256     private feeBase;
    uint        applyCoinId;
    address     public daoAddress;
    uint256     public registeFee;
    constructor(IERC20 _DAOToken,IDAOMintingPool _IDAOMintingPool ) {
        initializeOwner();
        daoMintingPool = _IDAOMintingPool;
        DAOToken            = _DAOToken;
        priceDecimals   = 4;
        TOKEN_DECIMALS  = 18;
        PRICE_DECIMALS  = 6;
        registerAmount  = 1 * (10 ** uint256(TOKEN_DECIMALS));
        fee             = 5;
        feeBase         = 1000;
        applyCoinId     = 1;
        addapplyCoin(msg.sender ,"ETH",18);          
        registeFee      = 0;
        _owner = msg.sender;

       
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
        uint        blockTime;           //区块时间
        uint        openTime;            //开始时间，将天设置为秒 1天=86400

    }
    struct idoCoinInfo{
        idoCoinInfoHead idoCoinHead; 
        uint        timestamp;          
        address     coinAddress;
        uint256     idoAmountTotal;      //募集总数量 
        uint256     registerAmount;      //注册费用
        uint256     collectAmount;       //募集到 1:ETH  2:USDT  3:DAOToken 数量

        uint256     allCollectAmount;    
        
        uint256     idoAmountComplete;   //募集完成数量

        uint256     daoCollectAmount;   //DAO里面预留的币 1:ETH  2:USDT  3:DAOToken 数量
        uint256     dexCollectAmount;   //DEX里面预留的币 1:ETH  2:USDT  3:DAOToken 数量

        bool        bExpired;           //是否过期，是否结束
        uint        buyNonce;           //购买次数，累计
        bool        bTop;               //是否排在第一页 
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
 
    /**
    新建IDO上币资料
     */
    function createIeoCoin(idoCoinInfoHead memory idoCoinHead) public payable returns(bool){
        require(idoCoinHead.coinAddress != address(0));
        require(idoCoinHead.idoAmount > 0);
        address coinAddress = idoCoinHead.coinAddress;
        require(idoCoin[coinAddress].idoCoinHead.coinAddress == address(0));  
        require(msg.value >=  registerAmount );         //收取至少一个ETH                 
        idoCoinInfo memory newidoCoinInfo = idoCoinInfo({
            idoCoinHead:            idoCoinHead,
            timestamp:              block.timestamp,
            coinAddress:            coinAddress,
            idoAmountTotal:         (idoCoin[coinAddress].idoAmountTotal).add(idoCoinHead.idoAmount), 
            registerAmount:         msg.value,
            collectAmount:          0,
            allCollectAmount:       0,
            idoAmountComplete:      0,
            daoCollectAmount:       0,
            dexCollectAmount:       0,
            bExpired:               false,
            buyNonce:               0,
            bTop:                   false,
            createUserAddress:      msg.sender
            
        });
        
        idoCoin[coinAddress]  = newidoCoinInfo;        
        idoCoin[coinAddress].coinAddress = coinAddress;

        uint256 amount = idoCoinHead.idoAmount ;
        COIN =  IERC20(idoCoinHead.coinAddress) ;
        COIN.safeTransferFrom(msg.sender, address(this), amount);
        
        registeFee = registeFee.add(msg.value);
        emit CreateIeoCoin(msg.sender,idoCoinHead.coinAddress,block.timestamp,amount);      
        return true;
    }
    //blockTime
    function checkBuyStatus(address coinAddress) private view returns(bool){
        bool bStatus = false;
        if(block.timestamp > idoCoin[coinAddress].idoCoinHead.blockTime ){
            if( block.timestamp  > idoCoin[coinAddress].idoCoinHead.openTime ){
               bStatus = true;
            }
            else{
                bStatus = false;
            }
        }
        else{
            bStatus = false;
        }
        return bStatus;
    }
    //打新
    function IPOsubscription(address coinAddress,uint256 amount) public payable returns(bool){
        require(idoCoin[coinAddress].bExpired == false);        
 
        require(idoCoin[coinAddress].idoCoinHead.coinAddress != address(0));
        require(checkBuyStatus(coinAddress) == false ) ;   //还没有结束 

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
        emit IPOSUBscription(msg.sender,amount,APPLYCOIN);        
        return true;

    }
    function calculateMakeCoinAmount(address coinAddress,uint256 winningRate ) private view returns(uint256){
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 decimals = applyCoin[applyAddress].decimals;              
        uint256 to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;                                  
        
        uint256 makeCoinAmount;  //计算用于可以购买多少币    

        makeCoinAmount = (usercoin[msg.sender][coinAddress].takeCoinAmount.mul(10 ** to_decimals)).div(10 ** decimals);
        makeCoinAmount = makeCoinAmount.mul( idoCoin[coinAddress].idoCoinHead.price );
        makeCoinAmount = makeCoinAmount.div(10 ** uint256(PRICE_DECIMALS));
        makeCoinAmount = makeCoinAmount.mul(winningRate).div(1e10);
        return makeCoinAmount;
    }
    function calculateTakeBalnce(address coinAddress,uint256 winningRate) private view returns(uint256){
        uint256 const1e10 = 1e10;
        uint256 rateBalance = const1e10.sub(winningRate);
        uint256 takeBalance = usercoin[msg.sender][coinAddress].takeCoinAmount.sub( usercoin[msg.sender][coinAddress].takeCoinAmount.mul(rateBalance).div(1e10));
        return takeBalance;
    }
    //用户提币
    //winningRate 放大10^10次方  winningRate = winningRate.div(1e10) 必须在0--1之间
    function withdraw(address coinAddress,uint256 winningRate) public returns(bool){
        require(msg.sender != address(0));
        require(usercoin[msg.sender][coinAddress].takeCoinAmount > 0);

        require(usercoin[msg.sender][coinAddress].userAddress == msg.sender);

        address APPLYCOIN = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        uint256 makeCoinAmount = calculateMakeCoinAmount(coinAddress,winningRate) ;  //计算用于可以购买多少币                 
        uint256 takeBalance = calculateTakeBalnce(coinAddress,winningRate) ;

        usercoin[msg.sender][coinAddress].makeCoinAmount =  makeCoinAmount;
        //提取购买币
        COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress);   
        COIN.safeTransfer(msg.sender,makeCoinAmount );       
        //退款支付币
        if( winningRate.div(1e10) != 1 ){
            //address payable sender = address(uint160(msg.sender));
            if(idoCoin[coinAddress].idoCoinHead.collectType == 1){
                address(uint160(msg.sender)).transfer(takeBalance); 
            }else{
                IERC20(APPLYCOIN).safeTransfer(msg.sender, takeBalance);       
            }
            usercoin[msg.sender][coinAddress].takeCoinAmount = usercoin[msg.sender][coinAddress].takeCoinAmount.sub(takeBalance);
        }
        emit Withdraw(msg.sender,COIN, makeCoinAmount,coinAddress,takeBalance );
        return true;
    }
    //项目方提币
    function takeOut(address coinAddress) public returns(bool){
        require(idoCoin[coinAddress].collectAmount >= 0);                      
        require(idoCoin[coinAddress].createUserAddress == msg.sender );            

        require(checkBuyStatus(coinAddress) == true); 

        uint256 collectAmount = idoCoin[coinAddress].collectAmount;
        address applyAddress = applyCoinAddress[idoCoin[coinAddress].idoCoinHead.collectType];
        
        address APPLYCOIN  = applyCoin[applyAddress].contractAddress ;     
        idoCoin[coinAddress].collectAmount = 0;
        if( idoCoin[coinAddress].idoCoinHead.bDAO ){
            collectAmount = collectAmount.sub(idoCoin[coinAddress].daoCollectAmount);
            idoCoin[coinAddress].collectAmount = collectAmount ;         
        }
   
        if( collectAmount > 0 ){
            if( idoCoin[coinAddress].idoCoinHead.collectType == 1 ){
                address payable createUserAddress = address(uint160(idoCoin[coinAddress].createUserAddress));
                createUserAddress.transfer(collectAmount); 
            }
            else{
                IERC20(APPLYCOIN).safeTransfer(msg.sender,collectAmount);    
            }
        }
       
        idoCoin[coinAddress].collectAmount = 0;
        idoCoin[coinAddress].bExpired = true;

        uint256 balance = (idoCoin[coinAddress].idoCoinHead.idoAmount).sub(idoCoin[coinAddress].idoAmountComplete) ;
        uint decimals = applyCoin[applyAddress].decimals;
        uint to_decimals = idoCoin[coinAddress].idoCoinHead.decimals;

        uint256  dexCoinAmount =  idoCoin[coinAddress].dexCollectAmount;
        dexCoinAmount = (dexCoinAmount.mul(10 ** to_decimals)).div(10 ** decimals);     
        dexCoinAmount = dexCoinAmount.mul(idoCoin[coinAddress].idoCoinHead.price);          
        dexCoinAmount = dexCoinAmount.div(10 ** uint256(PRICE_DECIMALS));
        
        COIN = IERC20(idoCoin[coinAddress].idoCoinHead.coinAddress); 
        COIN.safeTransfer(msg.sender, balance); 
        emit TakeOut(msg.sender,idoCoin[coinAddress].collectAmount,idoCoin[coinAddress].idoCoinHead.collectType);
        return true;
    } 
  
 }