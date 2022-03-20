// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.4.22 <0.9.0;

// This import is automatically injected by Remix
import "remix_tests.sol";
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";

// This import is required to use custom transaction context
// Although it may fail compilation in 'Solidity Compiler' plugin
// But it will work fine in 'Solidity Unit Testing' plugin
import "remix_accounts.sol";
import "../contracts/NFT_ERC_1155.sol";

// File name has to end with '_test.sol', this file can contain more than one testSuite contracts
contract NFT_ERC1155_Opensea_Test is ERC1155Holder {
    NFT_ERC1155_Opensea Contract;
    uint256 mocTokenId =
        30023255597470553130038253632676893803264939041330077673152057021078700616407;
    string mockNFTValue = "myNFT";

    function beforeAll() public {
        Contract = new NFT_ERC1155_Opensea();
    }

    /// Custom Transaction Context: https://remix-ide.readthedocs.io/en/latest/unittesting.html#customization
    /// #sender: account-1
    /// #value: 160000000
    function canMintNewToken() public payable {
        uint256 _itemId = Contract.mintToken(mockNFTValue, 1);
        Assert.equal(_itemId, mocTokenId, "new itemId should equal to fixture");
    }

    function canReturnTokenId() public {
        // string memory _mapValue = Contract.uri(mockTestId);
        Assert.equal(
            Contract.uri(mocTokenId),
            mockNFTValue,
            "should return value by tokenId"
        );
        // console.log(_mapValue);
    }

    /// Custom Transaction Context: https://remix-ide.readthedocs.io/en/latest/unittesting.html#customization
    /// #sender: account-1
    /// #value: 160000000
    function shouldPreventDupelicateMint() public payable {
        try Contract.mintToken(mockNFTValue, 1) {
            Assert.ok(false, "method execution should fail");
        } catch Error(string memory reason) {
            Assert.equal(
                reason,
                "mapping already exist",
                "should give duplicaed "
            );
        } catch (bytes memory) {
            Assert.ok(false, "failed unexpected");
        }
    }
}
