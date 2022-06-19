// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vedao is ERC721Enumerable, Ownable {
    bool public saleIsActive = false;

    uint256 public constant MINT_PRICE = 0.1 ether;
    uint256 public constant MAX_PUBLIC_MINT = 5;
    uint256 public constant MAX_SUPPLY = 10000;

    mapping(address => bool) public allowList;

    constructor() ERC721("Vedao", "Dao") {}

    function mintAllowList() external payable{
        uint256 ts = totalSupply();
        require(allowList[msg.sender], "Not in whitelist");
        require(ts + 1 <= MAX_SUPPLY, "Purchase would exceed max tokens");
        // start minting
        allowList[msg.sender] = false;
        uint256 currentSupply = totalSupply();
        _safeMint(msg.sender, currentSupply + 1);
    }

    function mint(uint256 numberOfTokens) external payable {
        uint256 ts = totalSupply();
        require(numberOfTokens <= MAX_PUBLIC_MINT, "Exceeded max token purchase");
        require(saleIsActive, "Sale must be active to mint tokens");
        require(msg.value == numberOfTokens * MINT_PRICE, "Ether send below price");
        require(ts + numberOfTokens <= MAX_SUPPLY, "Purchase would exceed max tokens");
        // start minting
        uint256 currentSupply = totalSupply();
        for (uint256 i = 1; i <= numberOfTokens; i++) {
            _safeMint(msg.sender, currentSupply + i);
        }
    }

    function addAllowList(address _newEntry) external onlyOwner {
        allowList[_newEntry] = true;
    }

    function removeAllowList(address _newEntry) external onlyOwner {
        require(allowList[_newEntry], "Previous not in whitelist");
        allowList[_newEntry] = false;
    }

    function withdraw() public onlyOwner {
        uint256 balance = address(this).balance;
        payable(msg.sender).transfer(balance);
    }

    function reserve(uint256 n) public onlyOwner {
        uint256 supply = totalSupply();
        uint256 i;
        for (i = 0; i < n; i++) {
            _safeMint(msg.sender, supply + i);
        }
    }

    function setSaleState(bool newState) public onlyOwner {
        saleIsActive = newState;
    }
}
