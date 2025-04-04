// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NGORegistry.sol";

contract NGORegistryTest is Test {
    NGORegistry public registry;
    address owner = address(1);
    address ngo1 = address(2);
    address ngo2 = address(3);

    function setUp() public {
        vm.startPrank(owner);
        registry = new NGORegistry(owner);
        vm.stopPrank();
    }

    function testRegisterNGO() public {
        vm.startPrank(ngo1);
        registry.registerNGO("Relief Org 1", "https://relief1.org", "contact@relief1.org");

        NGORegistry.NGO memory ngoDetails = registry.getNGODetails(ngo1);
        assertEq(ngoDetails.name, "Relief Org 1");
        assertEq(ngoDetails.website, "https://relief1.org");
        assertEq(ngoDetails.contact, "contact@relief1.org");
        assertEq(ngoDetails.verified, false);
        vm.stopPrank();
    }

    function testVerifyNGO() public {
        // Register an NGO first
        vm.prank(ngo1);
        registry.registerNGO("Relief Org 1", "https://relief1.org", "contact@relief1.org");

        // Verify the NGO as owner
        vm.prank(owner);
        registry.verifyNGO(ngo1, true);

        // Check verification status
        bool isVerified = registry.isVerified(ngo1);
        assertTrue(isVerified);

        // Check verified NGOs count
        assertEq(registry.getVerifiedNGOsCount(), 1);
    }

    function testUpdateNGOInfo() public {
        // Register an NGO first
        vm.startPrank(ngo1);
        registry.registerNGO("Relief Org 1", "https://relief1.org", "contact@relief1.org");

        // Update NGO info
        registry.updateNGOInfo("Updated Org", "https://updated.org", "new@updated.org");
        vm.stopPrank();

        // Verify the update
        NGORegistry.NGO memory ngoDetails = registry.getNGODetails(ngo1);
        assertEq(ngoDetails.name, "Updated Org");
        assertEq(ngoDetails.website, "https://updated.org");
        assertEq(ngoDetails.contact, "new@updated.org");
    }

    function test_RevertWhen_VerifyNGONotOwner() public {
        // Register an NGO first
        vm.prank(ngo1);
        registry.registerNGO("Relief Org 1", "https://relief1.org", "contact@relief1.org");

        // Try to verify the NGO as non-owner (should revert)
        vm.prank(ngo2);
        // Updated to match the actual error from OpenZeppelin Ownable contract
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", ngo2));
        registry.verifyNGO(ngo1, true);
    }
}
