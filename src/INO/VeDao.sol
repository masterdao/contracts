// SPDX-License-Identifier: MIT
pragma solidity ^0.8.11;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract Vedao is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable {
    string private _baseURIextended;

    struct User {
        address entry;
        string uri;
        bool status;
    }

    mapping(address => User) public allowList;

    constructor() ERC721("Vedao104", "Dao104") {}

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

    function setTokenURI(uint256 tokenId, string memory uri) public onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    function mintAllowList() external payable {
        require(allowList[msg.sender].entry != address(0), "Not in whitelist");
        require(allowList[msg.sender].status == true, "Not in whitelist");
        // start minting
        allowList[msg.sender].status = false;
        uint256 nextSupply = totalSupply() + 1;
        _safeMint(msg.sender, nextSupply);
        _setTokenURI(nextSupply, allowList[msg.sender].uri);
    }

    function addAllowList(address _newEntry, string memory uri) external onlyOwner {
        allowList[_newEntry].entry = _newEntry;
        allowList[_newEntry].uri = uri;
        allowList[_newEntry].status = true;
    }

    function removeAllowList(address _newEntry) external onlyOwner {
        require(allowList[_newEntry].entry != address(0), "Not in whitelist");
        require(allowList[_newEntry].status, "Previous not in whitelist");
        allowList[_newEntry].status = false;
    }

    function getAllowList(address _newEntry) public view returns (User memory) {
        return allowList[_newEntry];
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }
}
