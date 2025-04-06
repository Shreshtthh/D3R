// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/IPFSVerifier.sol";

contract IPFSVerifierTest is Test {
    IPFSVerifier public verifier;

    address public submitter;
    address public verifierAddr;
    address public other;

    string public validCid = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
    string public fakeCid = "QmFAKEuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

    event DocumentRegistered(string cid, address indexed submitter);
    event DocumentVerified(string cid, address indexed verifier);

    function setUp() public {
        submitter = address(0x123);
        verifierAddr = address(0x456);
        other = address(0x789);

        verifier = new IPFSVerifier();
    }

    function testRegisterDocument() public {
        vm.prank(submitter);
        vm.expectEmit(false, true, false, true);
        emit DocumentRegistered(validCid, submitter);
        verifier.registerDocument(validCid);

        // Check document details
        (address documentSubmitter, uint256 timestamp, bool verified) = verifier.getDocumentDetails(validCid);
        assertEq(documentSubmitter, submitter);
        assertTrue(timestamp > 0);
        assertFalse(verified);
    }

    function test_RevertWhen_RegisteringEmptyCid() public {
        vm.expectRevert("Invalid IPFS CID");
        verifier.registerDocument("");
    }

    function test_RevertWhen_RegisteringTwice() public {
        string memory cid = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

        // First registration is successful
        verifier.registerDocument(cid);

        // Second registration should fail
        vm.expectRevert("Document already registered");
        verifier.registerDocument(cid);
    }

    function test_RevertWhen_VerifyingUnregisteredDocument() public {
        string memory cid = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

        vm.expectRevert("Document not registered");
        verifier.verifyDocument(cid);
    }

    function testVerifyDocument() public {
        // Register document
        vm.prank(submitter);
        verifier.registerDocument(validCid);

        // Verify document
        vm.prank(verifierAddr);
        vm.expectEmit(false, true, false, true);
        emit DocumentVerified(validCid, verifierAddr);
        verifier.verifyDocument(validCid);

        // Check document is verified
        assertTrue(verifier.isDocumentVerified(validCid));
    }

    function testGetDocumentDetails() public {
        // Register document
        vm.prank(submitter);
        verifier.registerDocument(validCid);

        // Verify document
        vm.prank(verifierAddr);
        verifier.verifyDocument(validCid);

        // Get document details
        (address documentSubmitter, uint256 timestamp, bool verified) = verifier.getDocumentDetails(validCid);
        assertEq(documentSubmitter, submitter);
        assertTrue(timestamp > 0);
        assertTrue(verified);
    }

    function testIsDocumentVerified() public {
        // Register and verify document
        vm.prank(submitter);
        verifier.registerDocument(validCid);

        vm.prank(verifierAddr);
        verifier.verifyDocument(validCid);

        // Check verification status
        assertTrue(verifier.isDocumentVerified(validCid));
        assertFalse(verifier.isDocumentVerified(fakeCid));
    }
}
