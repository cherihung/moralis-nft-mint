// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.0;

// import ERC1155 contract from openzepplin
// https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/access/Ownable.sol";

contract NFTContract is ERC1155, Ownable {
    // for internal use only
    uint256 public constant ARTWORK = 0;
    uint256 public constant PHOTO = 1;

    // ERC1155 constructor takes in a string uri which is the URI to where the metadata json is stored
    // we need 1 json file for each NFT id (ARTWORK, PHOTO)
    // metadata structure https://docs.opensea.io/docs/metadata-standards#metadata-structure
    constructor() ERC1155("https://h0btfoilvovd.usemoralis.com/{id}.json") {
        // _mint(): https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/token/ERC1155/ERC1155.sol#L266
        /** params to take: address to, uint256 id, uint256 amount, bytes memory data **/
        _mint(msg.sender, ARTWORK, 1, "");
        _mint(msg.sender, PHOTO, 2, "");
    }

    // onlyOwner: function to only be called by the owner/creator of the contract, using open contract
    function mint(
        address to,
        uint256 id,
        uint256 amount
    ) public onlyOwner {
        _mint(to, id, amount, "");
    }

    // internally _burn check for operator is same as account/from as the token owner, we make sure here too with the require
    function burn(
        address from,
        uint256 id,
        uint256 amount
    ) public {
        require(msg.sender == from);
        _burn(from, id, amount);
    }
}
