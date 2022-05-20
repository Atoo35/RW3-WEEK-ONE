//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

contract KeccakNFT is ERC721Enumerable, Ownable {
    string _baseTokenURI;
    uint public _price = 0.001 ether;
    uint public maxTokenIds=20;
    uint public tokenIds;

    constructor (string memory baseURI, string memory _name, string memory _symbol) 
    ERC721(_name, _symbol) {
        _baseTokenURI = baseURI;
    }

    function mint() public payable{
        require(tokenIds<maxTokenIds, "Max token ids reached.");
        require(msg.value >= _price, "Not enough ETH sent.");
        _safeMint(msg.sender, tokenIds);
        tokenIds++;
    }

    function _baseURI() internal view virtual override returns(string memory){
        return _baseTokenURI;
    }

    function withdraw() public onlyOwner{
        address _owner = owner();
        uint amount = address(this).balance;
        (bool sent, ) = _owner.call{value:amount}("");
        require(sent, "Failed to send funds.");
    }

    receive() external payable{}
    fallback() external payable{}
}
