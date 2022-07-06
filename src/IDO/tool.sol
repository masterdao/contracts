// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./SafeMath.sol";
import "./Create2.sol";
import "./InitializableAdminUpgradeabilityProxy.sol";


contract toolContract  {
    using SafeMath for uint256;
    uint256 public PRICE_DECIMALS;
    constructor(){
        PRICE_DECIMALS = 6;
    }
    function computeAddress(bytes32 salt, address deployer) private pure returns (address) {
        bytes memory bytecode = type(InitializableAdminUpgradeabilityProxy).creationCode;
        return Create2.computeAddress(salt, keccak256(bytecode), deployer);
    }

    function getAddress(string memory name) public view returns (address) {
        bytes32 salt = keccak256(abi.encodePacked(name, block.timestamp, block.number, block.difficulty));
        return computeAddress(salt, address(this));
    }
        //上币返回的地址
    function calculateAllMakeCoinAmount(uint256 decimals,
        uint256 to_decimals,
        uint256 takeCoinAmount,
        uint256 price) public view returns (uint256) {
     

        uint256 makeCoinAmount; //计算用于可以购买多少币

        makeCoinAmount = (takeCoinAmount.mul(10**to_decimals)).div(10**decimals);
        makeCoinAmount = makeCoinAmount.mul(10**uint256(PRICE_DECIMALS));
        makeCoinAmount = makeCoinAmount.div(price);
        return makeCoinAmount;
    }

    //上币返回的地址
    function calculateTakeBalnce(uint256 makeCoinAmount,
        uint256 decimals,
        uint256 to_decimals,
        uint256 takeCoinAmount,
        uint256 price) public view returns (uint256) {
        uint256 allmakeCoinAmount = calculateAllMakeCoinAmount(decimals,to_decimals,takeCoinAmount,price);

        uint256 takeBalance = allmakeCoinAmount.sub(makeCoinAmount).mul(10**decimals).div(10**to_decimals);
        takeBalance = takeBalance.mul(price);
        takeBalance = takeBalance.div(10**uint256(PRICE_DECIMALS));
        return takeBalance;
    }
}