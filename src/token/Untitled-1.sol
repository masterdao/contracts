// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)

pragma solidity ^0.8.0;

import "./Context.sol";
import "./Ownable.sol";

abstract contract MultiSignature is Ownable {
    address[] private multiAddress;
    uint256 private multiNumber;
    uint256 public multiId;
    uint256 private signedNumber;
    uint256 public period;
    mapping(address => MultiInfo ) public multiInfoList;
    mapping(uint256 => uint256) public issuedAmount;

    struct  MultiInfo {
        bool    bmulti;
        bool    bSign;
        uint256    period ;
    } 

    constructor(){
        multiId = 0;
        signedNumber = 0;
        period = 0;
    }
    function setmultiNumber(uint256 number) public onlyOwner returns( bool){
        require(number <= multiId,"");
        multiNumber = number;
        return true;
    }
    function getmultiNumber() public view returns(uint256){
        return multiNumber;
    }
    function setmultiAddress(address addr) public onlyOwner returns (bool) {
        require(multiInfoList[addr].bmulti==false,"already exists. ");
        MultiInfo memory newmultiInfo = MultiInfo({
            bmulti : true,
            bSign : false,
            period: 0
        });
        multiInfoList[addr] = newmultiInfo;
        multiAddress.push(addr);
        multiId++;
        return true;
    }
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
    function startmultisignatureperiod() public onlyOwner returns(uint256){
        require(signedNumber == 0,""); //上次多签已经结束
        period ++;
        return period; 
    }
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