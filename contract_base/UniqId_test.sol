// SPDX-License-Identifier: GPL-3.0
        
pragma solidity >=0.4.22 <0.9.0;

// This import is automatically injected by Remix
import "remix_tests.sol"; 

// This import is required to use custom transaction context
// Although it may fail compilation in 'Solidity Compiler' plugin
// But it will work fine in 'Solidity Unit Testing' plugin
import "remix_accounts.sol";
import "../contracts/4_UniqId.sol";

// File name has to end with '_test.sol', this file can contain more than one testSuite contracts
contract HashIdTest {

    HashId Contract;

    function beforeEach() public {
        Contract = new HashId();
    }

    function canSetAndGetFromIdMap() public returns (bool) {
        Contract.hash("testUrl");
        Assert.equal(Contract.getUri(42570665192865161044207563722260963339281774411031972875598511131081857430022), "testUrl", "hashed id and uri should have been set");
    }
    
}
    