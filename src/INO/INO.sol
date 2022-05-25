// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;
import "./Ownable.sol";
import './IERC721.sol';
import './IERC20.sol';
import './SafeMath.sol';
import "./SafeERC20.sol";
/*
 * 上币 合约 
*/
contract INOERC721Contract is  Ownable {
    using SafeERC20 for     IERC20;
    using SafeMath for uint256;
    uint8       private TOKEN_DECIMALS; 
    uint8       private PRICE_DECIMALS;

    uint        applyCoinId;
    address     public daoAddress;
    uint256     public registeFee;
    constructor( ) {
        applyCoinId     = 1;
        addapplyCoin(msg.sender ,"ETH",18);     
    }
 
    
    event CreateInoCoin(address who,address coinAddress,uint256 tokenId,uint256 coinType,uint256 makeCoinAmount);
    event BuyNftToken(address coinAddress,uint256 tokeId,address who);
    event TakeOut(address who,address coinAddress,uint256 tokenId ) ;
    event Withdraw(address who,uint256 makeCoinAmount);

    struct inoCoinInfo{
        uint256     timestamp;
        address     coinAddress;
        uint256     tokenId;
        uint256     coinType;           //1:ETH  2:USDT  3:DAOToken      
        uint256     makeCoinAmount;       //募集到 1:ETH  2:USDT  3:DAOToken 数量
        uint256     openTime;            //开始时间，将天设置为秒 1天=86400 
        uint256     expireTime;          //到期日期 
        bool        bSell;
        bool        bBack;
        address payable    createUserAddress;  //创建代币的所有者 
    }
    mapping(address=>mapping(uint256=>inoCoinInfo)) inoCoin;  
                    
    struct userInfo{
        uint256         timestamp;          
        address         coinAddress;    
        uint256         tokenId;     
        uint256         coinType;           //支付币序号   
        uint256         takeCoinAmount;   //给出去   
    }
    mapping(address=> mapping(address => mapping(uint256 => userInfo))) usercoin;
    struct applyCoinInfo{
        uint        timestamp;
        address     contractAddress;
        string      symbol;
        uint        decimals;
    }
    mapping(address => applyCoinInfo) applyCoin;
    mapping(uint256 => address) applyCoinAddress;
    mapping(address => mapping(uint256=>uint256)) createCoin;
    
    uint256 [] applyCoinList;
  
    mapping(address => uint256[]) private NFTList;  //保存同一个地址下，有多少币上架
    //获取同一个地址下，有多少币上架
    function getNFTListlenght(address coinAddress) public view  returns(uint256){
        require(coinAddress != address(0));
        return NFTList[coinAddress].length;
    }
    //遍历同一个地址下，有多少币上架
    function getNFTListData(address coinAddress,uint256 index) public view returns(uint256){
        require(coinAddress != address(0));
        require(index < NFTList[coinAddress].length);
        return NFTList[coinAddress][index];
    }
    //获取支付币列表
    function getapplyCoinListLenght() public view returns(uint256){
        return applyCoinList.length;
    }
    //获取支付币地址
    function getapplyCoinListData(uint index) public view returns(uint256){
        require(applyCoinList.length > index);
        return applyCoinList[index];
    }
    //获取支付币地址
    function getapplyCoinAddress(uint256 coinId) public view returns(address){
        return applyCoinAddress[coinId];
    }
    function getapplyCoin(address contractAddress) public view returns(applyCoinInfo memory){
        return applyCoin[contractAddress];
    }
    //新增支付币
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
  
    //获取用户购币信息
    function getUserInfo(address userAddress,address coinAddress,uint256 tokenId) public view returns(userInfo memory){
        require(userAddress != address(0));
        require(coinAddress != address(0));
        require(tokenId >=0 );
        return usercoin[userAddress][coinAddress][tokenId];
    }
    //获取INO币信息
    function getinoCoin( address coinAddress,uint256 tokenId ) public view returns(inoCoinInfo memory){
        require( coinAddress != address(0) );           
        return inoCoin[coinAddress][tokenId];
    }
 
    /**
    新建IEO上币资料
     */
    function createINOCoin(inoCoinInfo memory myInoCoinInfo,uint256[] memory ids) public payable returns(bool){
        require(myInoCoinInfo.coinAddress != address(0));
        require(myInoCoinInfo.expireTime>= block.timestamp);
        require(myInoCoinInfo.bSell == false);
        address coinAddress  = myInoCoinInfo.coinAddress;
        for(uint256 i =0;i< ids.length;i++){

            inoCoin[coinAddress][ids[i]] = myInoCoinInfo;  //获取上币信息
            inoCoin[coinAddress][ids[i]].timestamp = block.timestamp;
            inoCoin[coinAddress][ids[i]].createUserAddress = payable(msg.sender);
            inoCoin[coinAddress][ids[i]].bSell = false;
            inoCoin[coinAddress][ids[i]].bBack = false;
            inoCoin[coinAddress][ids[i]].tokenId = ids[i];

            NFTList[coinAddress].push(ids[i]);

            IERC721(coinAddress).transferFrom(msg.sender,address(this),ids[i]);
            emit CreateInoCoin(msg.sender,coinAddress,ids[i],myInoCoinInfo.coinType,myInoCoinInfo.makeCoinAmount); 
        }
             
        return true;
    }
    //获取NFT是否被卖掉
    function getCoinSell(address coinAddress,uint256 tokenId) public view returns(bool){
        require(coinAddress != address(0));
        require(tokenId >= 0);
        return inoCoin[coinAddress][tokenId].bSell;
    }
    
    //用于买币
    function buyNftToken(address coinAddress,uint256 tokenId) public payable returns(bool){
        require(coinAddress != address(0));
        require(tokenId >= 0);
        require(inoCoin[coinAddress][tokenId].bSell == false);
        
        //处理市场售卖情况
        uint256 makeCoinAmount = inoCoin[coinAddress][tokenId].makeCoinAmount;
        address payable createUserAddress = inoCoin[coinAddress][tokenId].createUserAddress;
        uint256 coinType = inoCoin[coinAddress][tokenId].coinType;

        createCoin[createUserAddress][coinType] = createCoin[createUserAddress][coinType].add(makeCoinAmount);
        
        if(inoCoin[coinAddress][tokenId].coinType == 1){                                        
            require(msg.value >= makeCoinAmount );
            payable(address(this)).transfer(makeCoinAmount);
        }
        else{
            address ApplyCoin = getapplyCoinAddress(inoCoin[coinAddress][tokenId].coinType); //获取支付币的地址
            require(ApplyCoin != address(0));
            require(IERC20(ApplyCoin).balanceOf(msg.sender) >= inoCoin[coinAddress][tokenId].makeCoinAmount);
            IERC20(ApplyCoin).transferFrom(msg.sender, address(this), makeCoinAmount);  
        }
        inoCoin[coinAddress][tokenId].bSell = true; //卖出
        //保存用户购币情况
        userInfo memory newuserInfo = userInfo({
            timestamp:          block.timestamp,
            coinAddress:        coinAddress,
            tokenId:            tokenId,
            coinType:           inoCoin[coinAddress][tokenId].coinType,
            takeCoinAmount:     inoCoin[coinAddress][tokenId].makeCoinAmount
        });

        usercoin[msg.sender][coinAddress][tokenId] = newuserInfo; //保存用户购币情况

        IERC721(inoCoin[coinAddress][tokenId].coinAddress).safeTransferFrom(address(this),msg.sender,tokenId);

        emit BuyNftToken(inoCoin[coinAddress][tokenId].coinAddress,tokenId,msg.sender);
        return true;

    }
 
    //过期项目方提币
    function takeOut(address coinAddress,uint256 tokenId) public returns(bool){
        require(inoCoin[coinAddress][tokenId].expireTime <= block.timestamp);  //过期了                      
        require(inoCoin[coinAddress][tokenId].createUserAddress == msg.sender );            
        require(inoCoin[coinAddress][tokenId].bSell == false);
        require(inoCoin[coinAddress][tokenId].bBack == false);
        inoCoin[coinAddress][tokenId].bSell = true; //卖出
        inoCoin[coinAddress][tokenId].bBack = true;

        IERC721(inoCoin[coinAddress][tokenId].coinAddress).safeTransferFrom(address(this),msg.sender,tokenId);
        emit TakeOut(msg.sender,inoCoin[coinAddress][tokenId].coinAddress,tokenId);
        return true;
    } 
    //获取项目方卖币的资金
    function getSellCoin(address coinAddress,uint256 coinType) public view returns(uint256){
        return  createCoin[coinAddress][coinType];
    }
    //项目方提取卖币的资金
    function withdraw(uint256 coinType) public returns(bool){

        require(createCoin[msg.sender][coinType] > 0);
        address ApplyCoin = getapplyCoinAddress(coinType); //获取支付币的地址
        uint256 makeCoinAmount = createCoin[msg.sender][coinType];
        createCoin[msg.sender][coinType] = 0;
        if(coinType ==1){
            payable(address(msg.sender)).transfer(makeCoinAmount);
        }
        else{
            IERC20(ApplyCoin).transfer(msg.sender, makeCoinAmount);
        }
        emit Withdraw(msg.sender,makeCoinAmount);
        return true;
    }
 }