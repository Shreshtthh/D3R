// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NGORegistry.sol";

contract NGORegistryTest is Test {
    NGORegistry public registry;

    address public owner;
    address public ngo1;
    address public ngo2;
    address public nonOwner;

    event NGORegistered(address indexed ngo, string name);
    event NGOVerified(address indexed ngo, bool status);
    event NGOUpdated(address indexed ngo, string name, string website, string contact);

    function setUp() public {
        owner = address(this);
        ngo1 = address(0x123);
        ngo2 = address(0x456);
        nonOwner = address(0x789);

        registry = new NGORegistry(owner);
    }

    function testDeployment() public {
        assertEq(registry.owner(), owner);
    }

    function testRegisterNGO() public {
        string memory name = "Red Cross";
        string memory website = "https://redcross.org";
        string memory contact = "contact@redcross.org";

        vm.prank(ngo1);
        vm.expectEmit(true, false, false, true);
        emit NGORegistered(ngo1, name);
        registry.registerNGO(name, website, contact);

        NGORegistry.NGO memory ngo = registry.getNGODetails(ngo1);
        assertEq(ngo.name, name);
        assertEq(ngo.website, website);
        assertEq(ngo.contact, contact);
        assertFalse(ngo.verified);
    }

    function test_RevertWhen_RegisteringTwice() public {
        vm.startPrank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");

        // This should fail
        vm.expectRevert("NGO already registered");
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");
        vm.stopPrank();
    }

    function testUpdateNGOInfo() public {
        vm.startPrank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");

        string memory newName = "Red Cross International";
        string memory newWebsite = "https://redcrossinternational.org";
        string memory newContact = "info@redcrossinternational.org";

        vm.expectEmit(true, false, false, true);
        emit NGOUpdated(ngo1, newName, newWebsite, newContact);
        registry.updateNGOInfo(newName, newWebsite, newContact);
        vm.stopPrank();

        NGORegistry.NGO memory ngo = registry.getNGODetails(ngo1);
        assertEq(ngo.name, newName);
        assertEq(ngo.website, newWebsite);
        assertEq(ngo.contact, newContact);
    }

    function test_RevertWhen_UpdatingUnregisteredNGO() public {
        vm.prank(ngo1);
        vm.expectRevert("NGO not registered");
        registry.updateNGOInfo("Red Cross", "https://redcross.org", "contact@redcross.org");
    }

    function testVerifyNGO() public {
        // Register an NGO
        vm.prank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");

        // Verify NGO
        vm.expectEmit(true, false, false, true);
        emit NGOVerified(ngo1, true);
        registry.verifyNGO(ngo1, true);

        // Check if verified
        assertTrue(registry.isVerified(ngo1));
        assertEq(registry.getVerifiedNGOsCount(), 1);
    }

    function testUnverifyNGO() public {
        // Register and verify an NGO
        vm.prank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");
        registry.verifyNGO(ngo1, true);

        // Unverify NGO
        vm.expectEmit(true, false, false, true);
        emit NGOVerified(ngo1, false);
        registry.verifyNGO(ngo1, false);

        // Check if no longer verified
        assertFalse(registry.isVerified(ngo1));
    }

    function test_RevertWhen_NonOwnerVerifies() public {
        // Register an NGO
        vm.prank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");

        // Non-owner tries to verify
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        registry.verifyNGO(ngo1, true);
    }

    function test_RevertWhen_VerifyingUnregisteredNGO() public {
        vm.expectRevert("NGO not registered");
        registry.verifyNGO(ngo1, true);
    }

    function testGetNGODetails() public {
        string memory name = "Red Cross";
        string memory website = "https://redcross.org";
        string memory contact = "contact@redcross.org";

        vm.prank(ngo1);
        registry.registerNGO(name, website, contact);

        NGORegistry.NGO memory ngo = registry.getNGODetails(ngo1);
        assertEq(ngo.name, name);
        assertEq(ngo.website, website);
        assertEq(ngo.contact, contact);
        assertFalse(ngo.verified);
    }

    function test_RevertWhen_GettingUnregisteredNGODetails() public {
        vm.expectRevert("NGO not registered");
        registry.getNGODetails(ngo1);
    }

    function testVerifiedNGOsCount() public {
        // Register NGOs
        vm.prank(ngo1);
        registry.registerNGO("Red Cross", "https://redcross.org", "contact@redcross.org");

        vm.prank(ngo2);
        registry.registerNGO("Doctors Without Borders", "https://dwb.org", "contact@dwb.org");

        // Initially no verified NGOs
        assertEq(registry.getVerifiedNGOsCount(), 0);

        // Verify first NGO
        registry.verifyNGO(ngo1, true);
        assertEq(registry.getVerifiedNGOsCount(), 1);

        // Verify second NGO
        registry.verifyNGO(ngo2, true);
        assertEq(registry.getVerifiedNGOsCount(), 2);
    }
}
