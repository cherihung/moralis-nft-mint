// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

// Creating a contract
contract hashId {
    mapping(uint256 => string) private _uriIdMap;

    function hash(string memory _uri) public returns (uint256) {
        bytes32 _hashId = keccak256(abi.encode(_uri));
        uint256 _id = bytes32ToInt(_hashId);

        // require mapping to not exist. all mapping without value = 0
        require(bytes(_uriIdMap[_id]).length == 0, "mapping already exist");

        setUri(_id, _uri);

        return _id;
    }

    function getUri(uint256 id) public view returns (string memory) {
        return _uriIdMap[id];
    }

    function setUri(uint256 id, string memory uri) private {
        _uriIdMap[id] = uri;
    }

    function bytes32ToInt(bytes32 _hashId) private pure returns (uint256) {
        return uint256(_hashId);
    }
}
