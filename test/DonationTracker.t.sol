// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/DonationTracker.sol";
import "./mocks/MockFundPool.sol";

contract DonationTrackerTest is Test {
    DonationTracker public tracker;
    MockFundPool public fundPool;

    address public owner;
    address public ngo;
    address public donor;
    address public nonOwner;

    uint256 public fundId = 1;
    uint256 public milestoneIndex = 0;
    string public description = "First milestone report";
    string public proofCID = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

    event ReportSubmitted(uint256 indexed fundId, uint256 indexed milestoneIndex, string description, string proofCID);
    event ReportApproved(uint256 indexed fundId, uint256 indexed milestoneIndex);
    event ReportRejected(uint256 indexed fundId, uint256 indexed milestoneIndex, string reason);

    function setUp() public {
        owner = address(this);
        ngo = address(0x123);
        donor = address(0x456);
        nonOwner = address(0x789);

        // Deploy mock FundPool
        fundPool = new MockFundPool();

        // Deploy DonationTracker
        tracker = new DonationTracker(address(fundPool));
    }

    function testDeployment() public {
        assertEq(tracker.owner(), owner);
        assertEq(address(tracker.fundPool()), address(fundPool));
    }

    function testSubmitReport() public {
        vm.prank(ngo);
        vm.expectEmit(true, true, false, true);
        emit ReportSubmitted(fundId, milestoneIndex, description, proofCID);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);

        (string memory storedDesc, string memory storedCID, bool approved) =
            tracker.getReportDetails(fundId, milestoneIndex);
        assertEq(storedDesc, description);
        assertEq(storedCID, proofCID);
        assertFalse(approved);
    }

    function test_RevertWhen_SubmittingReportWithEmptyCID() public {
        vm.prank(ngo);
        vm.expectRevert("Proof CID required");
        tracker.submitReport(fundId, milestoneIndex, description, "");
    }

    function testApproveReport() public {
        // Submit a report first
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);

        // Approve the report
        vm.expectEmit(true, true, false, false);
        emit ReportApproved(fundId, milestoneIndex);
        tracker.approveReport(fundId, milestoneIndex);

        // Check report is approved
        (,, bool approved) = tracker.getReportDetails(fundId, milestoneIndex);
        assertTrue(approved);

        // Check FundPool was called
        assertEq(fundPool.lastFundId(), fundId);
        assertEq(fundPool.lastMilestoneIndex(), milestoneIndex);
        assertTrue(fundPool.releaseWasCalled());
    }

    function test_RevertWhen_NonOwnerApprovesReport() public {
        // Submit a report first
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);

        // Non-owner tries to approve
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        tracker.approveReport(fundId, milestoneIndex);
    }

    function test_RevertWhen_ApprovingNonExistentReport() public {
        vm.expectRevert("Report does not exist");
        tracker.approveReport(999, 999);
    }

    function test_RevertWhen_ApprovingAlreadyApprovedReport() public {
        // Submit and approve a report
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);
        tracker.approveReport(fundId, milestoneIndex);

        // Try to approve again
        vm.expectRevert("Report already approved");
        tracker.approveReport(fundId, milestoneIndex);
    }

    function testRejectReport() public {
        // Submit a report first
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);

        string memory reason = "Insufficient documentation";

        // Reject the report
        vm.expectEmit(true, true, false, true);
        emit ReportRejected(fundId, milestoneIndex, reason);
        tracker.rejectReport(fundId, milestoneIndex, reason);
    }

    function test_RevertWhen_NonOwnerRejectsReport() public {
        // Submit a report first
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);

        // Non-owner tries to reject
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        tracker.rejectReport(fundId, milestoneIndex, "Some reason");
    }

    function test_RevertWhen_RejectingNonExistentReport() public {
        vm.expectRevert("Report does not exist");
        tracker.rejectReport(999, 999, "Some reason");
    }

    function test_RevertWhen_RejectingApprovedReport() public {
        // Submit and approve a report
        vm.prank(ngo);
        tracker.submitReport(fundId, milestoneIndex, description, proofCID);
        tracker.approveReport(fundId, milestoneIndex);

        // Try to reject
        vm.expectRevert("Report already approved");
        tracker.rejectReport(fundId, milestoneIndex, "Some reason");
    }

    function testApproveReportLegacy() public {
        // Submit a report first
        vm.prank(ngo);
        tracker.submitReport(fundId, 0, description, proofCID);

        // Approve the report using legacy function
        vm.expectEmit(true, true, false, false);
        emit ReportApproved(fundId, 0);
        tracker.approveReportLegacy(fundId);

        // Check report is approved
        (,, bool approved) = tracker.getReportDetails(fundId, 0);
        assertTrue(approved);

        // Check FundPool legacy function was called
        assertEq(fundPool.lastFundId(), fundId);
        assertTrue(fundPool.legacyReleaseWasCalled());
    }
}
