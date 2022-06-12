// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MockToken is ERC20, Ownable {
    uint8 private _decimals;

    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply
    ) ERC20(name, symbol) {
        _mint(msg.sender, initialSupply);
        _decimals = 18;
    }

    function setDecimals(uint8 value) public onlyOwner {
        require(value > 0 && value < 19, "decimals must greater than 0 and less than 19");
        _decimals = value;
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }
}
