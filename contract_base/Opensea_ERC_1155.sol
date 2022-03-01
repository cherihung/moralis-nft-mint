// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Opensea_NFT_ERC1155 is ERC1155, Ownable {
    //Contract inspired from https://www.youtube.com/watch?v=19SSvs32m8I&ab_channel=ArturChmaro
    // https://github.com/Aurelien-Pelissier/Medium/blob/main/Fully%20Decentralized%20ERC-721%20and%20ERC-1155%20NFTs/contracts/ERC1155.sol

    mapping(uint256 => string) private _tokenURIs; //We create the mapping for TokenID -> URI
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds; //Counter to keep track of the number of NFT we minted and make sure we dont try to mint the same twice

    constructor() ERC1155("dynamic_upon_minting") {}

    function mintToken(string memory tokenURI, uint256 amount)
        public
        onlyOwner
        returns (uint256)
    {
        uint256 newItemId = _tokenIds.current();
        _mint(msg.sender, newItemId, amount, ""); //_mint(account, id, amount, data), data is usually set to ""
        _setTokenUri(newItemId, tokenURI);

        _tokenIds.increment();

        return newItemId;
    }

    //We override the uri function of the EIP-1155: Multi Token Standard (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol)
    function uri(uint256 tokenId) public view override returns (string memory) {
        return (_tokenURIs[tokenId]);
    }

    function _setTokenUri(uint256 tokenId, string memory tokenURI) private {
        _tokenURIs[tokenId] = tokenURI;
    }
}
