// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)

pragma solidity ^0.8.0;

import "./Context.sol";
import "./Ownable.sol";

abstract contract multi_signature is Ownable {
    address []  multiAddress;
    uint256     multiNumber;
    uint256   public  multiId;
    uint256     signedNumber;
    uint256   public  period;
    struct multiInfo{
        bool    bmulti;
        bool    bSign;
        uint256     period ;
    }
    mapping(address => multiInfo ) public multiInfoList;
    mapping(uint256 => uint256) public issuedAmount;
    constructor(){
        multiId = 0;
        signedNumber = 0;
        period = 0;
    }
  /*
  @设定多签人数，设定数量必须小于签名人数
   */
    function setmultiNumber(uint256 number) public onlyOwner returns( bool){
        require(number <= multiId,"");
        multiNumber = number;
        return true;
    }
    /***
    @ 获取多签人数
     */
    function getmultiNumber() public view returns(uint256){
        return multiNumber;
    }
    /*
    @设定多签地址
     */
    function setmultiAddress(address addr) public onlyOwner returns (bool) {
        require(multiInfoList[addr].bmulti==false,"already exists. ");
        multiInfo memory newmultiInfo = multiInfo({
            bmulti : true,
            bSign : false,
            period: 0
        });
        multiInfoList[addr] = newmultiInfo;
        multiAddress.push(addr);
        multiId++;
        return true;
    }
    /*
    @检查该地址是否是多签地址
     */
    function getmultiAddress(address addr) public view returns (bool){
        return multiInfoList[addr].bmulti;
    }

    function getmultiAddresslength() public view returns (uint256){
        return multiAddress.length;
    }
    
    function getmultiAddressinfo( uint256 id ) public view returns(address){
        require(id<multiAddress.length ,"" );
        return multiAddress[id];
    }
    /*
    @删除多签地址
     */
    function delmultiAddress(address addr,uint256 id) public onlyOwner returns(bool){
        multiInfoList[addr].bmulti = false;
        multiInfoList[addr].bSign = false;
        multiId --;
        require(multiAddress[id] == addr,"");
        multiAddress[id] = address(0);
        return true;
    }
    function getmultisignatureperiod() public view returns(uint256){
        return period;
    } 
    /*
    @启动多签
     */
    function startmultisignatureperiod() public onlyOwner returns(uint256){
        require(signedNumber == 0,""); //上次多签已经结束
        period ++;
        return period; 
    }
    /*
    @多签
     */
     function multisignature(uint256 amount) internal  returns(bool){
         require(multiId != 0 ,"no sign");  //有效的多签人数大于0
         require(multiInfoList[msg.sender].bmulti ,"no candidate"); //不是候选人，拒绝
         require(multiInfoList[msg.sender].period != period,"period" ); //本届还没有完成签名
         if( issuedAmount[period] == 0 ){
             issuedAmount[period] = amount;
         }else{
             require(issuedAmount[period] == amount ,"issue error.");
         }
         multiInfoList[msg.sender].bSign = true;
         multiInfoList[msg.sender].period = period; 
         signedNumber ++;
         if( signedNumber == multiNumber ){
             signedNumber = 0; //恢复状态，准备下一届签名            
             return true;             
         }else{
             return false;
         }
         
     }
     /*
     @获取多签状态
      */
    function getmultisignatureStatus( uint256 currencyperiod) public view returns(bool){
        require(currencyperiod >=0);
        if( multiInfoList[msg.sender].period == currencyperiod){
            return multiInfoList[msg.sender].bSign ;
        }
        else{
            return false;
        }
        
    }
}