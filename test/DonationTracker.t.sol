// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NGORegistry.sol";
import "../src/FundPool.sol";
import "../src/DonationTracker.sol";

contract DonationTrackerTest is Test {
    NGORegistry public registry;
    FundPool public fundPool;
    DonationTracker public tracker;
    
    address owner = address(1);
    address ngo = address(2);
    address donor = address(3);
    
    function setUp() public {
        // Deploy and configure the contracts
        vm.startPrank(owner);
        registry = new NGORegistry(owner);
        
        // Register and verify NGO
        vm.stopPrank();
        vm.startPrank(ngo);
        registry.registerNGO("Test NGO", "https://testngo.org", "contact@testngo.org");
        vm.stopPrank();
        vm.prank(owner);
        registry.verifyNGO(ngo, true);
        
        // Deploy FundPool
        vm.prank(owner);
        fundPool = new FundPool(address(registry));
        
        // Deploy DonationTracker
        vm.prank(owner);
        tracker = new DonationTracker(address(fundPool));
        
        // Authorize tracker
        vm.prank(owner);
        fundPool.setTrackerAuthorization(address(tracker), true);
        
        // Give donor some ETH
        vm.deal(donor, 10 ether);
        
        // Create a donation to work with
        vm.prank(donor);
        fundPool.donate{value: 1 ether}(ngo);
        
        // Add a milestone
        vm.prank(owner);
        fundPool.addMilestone(1, "First milestone", 0.5 ether);
    }
    
    function testSubmitReport() public {
        // Submit a milestone report
        vm.prank(owner);
        tracker.submitReport(
            1,           // fundId
            0,           // milestoneIndex
            "Work completed on first milestone", // description
            "QmHashOfProofDocuments"  // IPFS CID
        );
        
        // Verify report details
        (uint256 fundId, uint256 milestoneIndex, string memory description, string memory proofCID, bool approved) = 
            tracker.reports(1, 0);
        
        assertEq(fundId, 1);
        assertEq(milestoneIndex, 0);
        assertEq(description, "Work completed on first milestone");
        assertEq(proofCID, "QmHashOfProofDocuments");
        assertEq(approved, false);
    }
    
    function testApproveReport() public {
        // First submit a report
        vm.prank(owner);
        tracker.submitReport(
            1,           // fundId
            0,           // milestoneIndex
            "Work completed on first milestone", // description
            "QmHashOfProofDocuments"  // IPFS CID
        );
        
        // Get NGO balance before approval
        uint256 ngoBefore = ngo.balance;
        
        // Approve the report
        vm.prank(owner);
        tracker.approveReport(1, 0);
        
        // Check report is marked as approved
        (, , , , bool approved) = tracker.reports(1, 0);
        assertTrue(approved);
        
        // Check funds were released
        uint256 ngoAfter = ngo.balance;
        assertEq(ngoAfter - ngoBefore, 0.5 ether);
        
        // Verify milestone is marked as released in FundPool
        (, , bool released) = fundPool.getMilestone(1, 0);
        assertTrue(released);
    }
    
    function test_RevertWhen_ApprovingNonExistentReport() public {
        // Try to approve a report that doesn't exist
        vm.prank(owner);
        vm.expectRevert("Report does not exist");
        tracker.approveReport(1, 1);
    }
    
    function test_RevertWhen_SubmittingReportWithEmptyProof() public {
        // Submit a report with empty proof CID
        vm.prank(owner);
        vm.expectRevert("Proof CID required");
        tracker.submitReport(
            1,           // fundId
            0,           // milestoneIndex
            "Work completed on first milestone", // description
            ""           // Empty IPFS CID - should fail
        );
    }
    
    function test_RevertWhen_NonOwnerApproval() public {
        // First submit a report
        vm.prank(owner);
        tracker.submitReport(
            1,           // fundId
            0,           // milestoneIndex
            "Work completed on first milestone", // description
            "QmHashOfProofDocuments"  // IPFS CID
        );
        
        // Try to approve as non-owner
        vm.prank(donor);
        // Updated to match the actual error from OpenZeppelin Ownable contract
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", donor));
        tracker.approveReport(1, 0);
    }
}
