// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vedao is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    string private _baseURIextended;

    struct User {
        address entry;
        string uri;
        string level;
        bool status;
    }
    mapping(address => mapping(string => User)) allowList;
    string[] levelList;

    constructor() ERC721("Vedao", "Dao888") {}

    function addLevel(string memory level) external onlyOwner {
        levelList.push(level);
    }

    function getLevel(uint256 index) public view returns (string memory) {
        return levelList[index];
    }

    function getLevelListLength() public view returns (uint256) {
        return levelList.length;
    }

    function hashCompareWithLengthCheck(string memory a, string memory b) internal pure returns (bool) {
        if (bytes(a).length != bytes(b).length) {
            return false;
        } else {
            return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
        }
    }

    function checkLevel(string memory level) private view returns (bool) {
        bool result = false;
        for (uint256 i = 0; i < getLevelListLength(); i++) {
            if (hashCompareWithLengthCheck(getLevel(i), level)) {
                result = true;
            }
        }
        return result;
    }

    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override(ERC721, ERC721Enumerable) {
        super._beforeTokenTransfer(from, to, tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }

    function setBaseURI(string memory baseURI_) external onlyOwner {
        _baseURIextended = baseURI_;
    }

    function _baseURI() internal view virtual override returns (string memory) {
        return _baseURIextended;
    }

    function mintAllowList(string memory level) external payable {
        require(checkLevel(level), "Level is no");
        require(allowList[msg.sender][level].entry != address(0), "Not in whitelist");
        require(allowList[msg.sender][level].status == true, "Not in whitelist");
        // start minting
        allowList[msg.sender][level].status = false;
        uint256 nextSupply = totalSupply() + 1;
        _safeMint(msg.sender, nextSupply);
        _setTokenURI(nextSupply, allowList[msg.sender][level].uri);
    }

    function addAllowList(
        address _newEntry,
        string memory uri,
        string memory level
    ) external onlyOwner {
        require(allowList[_newEntry][level].entry == address(0), "In whitelist");
        require(checkLevel(level), "Level is no");
        allowList[_newEntry][level].entry = _newEntry;
        allowList[_newEntry][level].uri = uri;
        allowList[_newEntry][level].status = true;
    }

    function removeAllowList(address _newEntry, string memory level) external onlyOwner {
        require(allowList[_newEntry][level].entry != address(0), "Not in whitelist");
        allowList[_newEntry][level].status = false;
    }

    function updateAllowList(
        address _newEntry,
        string memory uri,
        string memory level
    ) external onlyOwner {
        require(allowList[_newEntry][level].entry != address(0), "Not in whitelist");
        allowList[_newEntry][level].uri = uri;
        allowList[_newEntry][level].status = true;
    }

    function getAllowList(address _newEntry, string memory level) public view returns (User memory) {
        return allowList[_newEntry][level];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
