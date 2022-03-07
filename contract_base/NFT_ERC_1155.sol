// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract NFT_ERC1155_Opensea is ERC1155, Ownable {
    mapping(uint256 => string) private _uriIdMap; //We create the mapping for TokenID -> URI

    constructor() ERC1155("dynamic_upon_minting") {}

    function mintToken(string memory tokenURI, uint256 amount)
        public
        onlyOwner
        returns (uint256)
    {
        bytes32 _hashId = keccak256(abi.encode(tokenURI));
        uint256 newItemId = bytes32ToInt(_hashId);

        // require mapping to not exist. all mapping without value = 0
        require(
            bytes(_uriIdMap[newItemId]).length == 0,
            "mapping already exist"
        );

        _mint(msg.sender, newItemId, amount, ""); //_mint(account, id, amount, data), data is usually set to ""
        setUri(newItemId, tokenURI);

        return newItemId;
    }

    //We override the uri function of the EIP-1155: Multi Token Standard (https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol)
    function uri(uint256 tokenId) public view override returns (string memory) {
        return _uriIdMap[tokenId];
    }

    function setUri(uint256 id, string memory tokenUri) private {
        _uriIdMap[id] = tokenUri;
    }

    function bytes32ToInt(bytes32 hashId) private pure returns (uint256) {
        return uint256(hashId);
    }
}
