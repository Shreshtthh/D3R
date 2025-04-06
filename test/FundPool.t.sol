// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/FundPool.sol";
import "../src/NGORegistry.sol";

contract FundPoolTest is Test {
    FundPool public fundPool;
    NGORegistry public ngoRegistry;
    
    address public owner;
    address public ngo;
    address public donor;
    address public tracker;
    address public nonAuthorized;
    
    event DonationReceived(uint256 indexed fundId, address indexed donor, address indexed ngo, uint256 amount);
    event FundsReleased(uint256 indexed fundId, address indexed ngo, uint256 amount, uint256 milestoneIndex);
    event TrackerAuthorized(address indexed tracker, bool status);
    event MilestoneAdded(uint256 indexed fundId, string description, uint256 amount);
    
    function setUp() public {
        owner = address(this);
        ngo = address(0x123);
        donor = address(0x456);
        tracker = address(0x789);
        nonAuthorized = address(0xABC);
        
        // Deploy NGORegistry
        ngoRegistry = new NGORegistry(owner);
        
        // Register and verify NGO
        vm.prank(ngo);
        ngoRegistry.registerNGO("Test NGO", "https://testngo.org", "contact@testngo.org");
        ngoRegistry.verifyNGO(ngo, true);
        
        // Deploy FundPool
        fundPool = new FundPool(address(ngoRegistry));
        
        // Authorize tracker
        fundPool.setTrackerAuthorization(tracker, true);
    }
    
    function testDeployment() public {
        assertEq(fundPool.owner(), owner);
        assertEq(address(fundPool.ngoRegistry()), address(ngoRegistry));
    }
    
    function testTrackerAuthorization() public {
        // Authorize a new tracker
        vm.expectEmit(true, false, false, true);
        emit TrackerAuthorized(nonAuthorized, true);
        fundPool.setTrackerAuthorization(nonAuthorized, true);
        
        assertTrue(fundPool.authorizedTrackers(nonAuthorized));
        
        // Remove authorization
        fundPool.setTrackerAuthorization(nonAuthorized, false);
        assertFalse(fundPool.authorizedTrackers(nonAuthorized));
    }
    
    function test_RevertWhen_NonOwnerAuthorizesTracker() public {
        vm.prank(nonAuthorized);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonAuthorized));
        fundPool.setTrackerAuthorization(nonAuthorized, true);
    }
    
    function testDonate() public {
        uint256 donationAmount = 1 ether;
        
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        vm.expectEmit(true, true, true, true);
        emit DonationReceived(1, donor, ngo, donationAmount);
        fundPool.donate{value: donationAmount}(ngo);
        
        assertEq(address(fundPool).balance, donationAmount);
        
        (address fundNgo, uint256 totalAmount, uint256 releasedAmount, bool completed, uint256 milestonesCount) = 
            fundPool.getFundDetails(1);
            
        assertEq(fundNgo, ngo);
        assertEq(totalAmount, donationAmount);
        assertEq(releasedAmount, 0);
        assertFalse(completed);
        assertEq(milestonesCount, 0);
    }
    
    function test_RevertWhen_DonatingToUnverifiedNGO() public {
        uint256 donationAmount = 1 ether;
        
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        vm.expectRevert("NGO is not verified");
        fundPool.donate{value: donationAmount}(nonAuthorized);
    }
    
    function test_RevertWhen_DonatingZero() public {
        vm.prank(donor);
        vm.expectRevert("Donation must be greater than 0");
        fundPool.donate{value: 0}(ngo);
    }
    
    function testAddMilestone() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        string memory milestoneDesc = "First milestone";
        uint256 milestoneAmount = 3 ether;
        
        vm.expectEmit(true, false, false, true);
        emit MilestoneAdded(fundId, milestoneDesc, milestoneAmount);
        fundPool.addMilestone(fundId, milestoneDesc, milestoneAmount);
        
        (string memory description, uint256 amount, bool released) = fundPool.getMilestone(fundId, 0);
        assertEq(description, milestoneDesc);
        assertEq(amount, milestoneAmount);
        assertFalse(released);
    }
    
    function test_RevertWhen_AddingMilestoneExceedingFund() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        string memory milestoneDesc = "Too large milestone";
        uint256 milestoneAmount = 11 ether; // More than donation
        
        vm.expectRevert("Insufficient remaining funds");
        fundPool.addMilestone(fundId, milestoneDesc, milestoneAmount);
    }
    
    function testReleaseMilestoneFunds() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        string memory milestoneDesc = "First milestone";
        uint256 milestoneAmount = 3 ether;
        
        // Add milestone
        fundPool.addMilestone(fundId, milestoneDesc, milestoneAmount);
        
        // Record NGO's initial balance
        uint256 initialNgoBalance = ngo.balance;
        
        // Release milestone funds
        vm.prank(tracker);
        vm.expectEmit(true, true, false, true);
        emit FundsReleased(fundId, ngo, milestoneAmount, 0);
        fundPool.releaseMilestoneFunds(fundId, 0);
        
        // Check milestone state
        (,, bool released) = fundPool.getMilestone(fundId, 0);
        assertTrue(released);
        
        // Check fund details
        (,, uint256 releasedAmount, bool completed,) = fundPool.getFundDetails(fundId);
        assertEq(releasedAmount, milestoneAmount);
        assertFalse(completed);
        
        // Check NGO balance increased
        assertEq(ngo.balance - initialNgoBalance, milestoneAmount);
    }
    
    function test_RevertWhen_ReleasingNonExistentMilestone() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        
        // Try to release non-existent milestone
        vm.prank(tracker);
        vm.expectRevert("Invalid milestone index");
        fundPool.releaseMilestoneFunds(fundId, 0);
    }
    
    function test_RevertWhen_ReleasingMilestoneTwice() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        fundPool.addMilestone(fundId, "First milestone", 3 ether);
        
        // Release once
        vm.prank(tracker);
        fundPool.releaseMilestoneFunds(fundId, 0);
        
        // Try to release again
        vm.prank(tracker);
        vm.expectRevert("Milestone funds already released");
        fundPool.releaseMilestoneFunds(fundId, 0);
    }
    
    function test_RevertWhen_UnauthorizedAddressReleasesOnly() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        fundPool.addMilestone(fundId, "First milestone", 3 ether);
        
        // Try to release as unauthorized address
        vm.prank(nonAuthorized);
        vm.expectRevert("Not authorized");
        fundPool.releaseMilestoneFunds(fundId, 0);
    }
    
    function testReleaseAllFunds() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        fundPool.addMilestone(fundId, "First milestone", 3 ether);
        
        // Release milestone
        vm.prank(tracker);
        fundPool.releaseMilestoneFunds(fundId, 0);
        
        // Record NGO's balance after milestone
        uint256 ngoBalanceAfterMilestone = ngo.balance;
        
        // Release all remaining funds
        vm.prank(tracker);
        fundPool.releaseFunds(fundId);
        
        // Check fund is completed
        (,, uint256 releasedAmount, bool completed,) = fundPool.getFundDetails(fundId);
        assertEq(releasedAmount, donationAmount);
        assertTrue(completed);
        
        // Check remaining funds were transferred
        assertEq(ngo.balance - ngoBalanceAfterMilestone, donationAmount - 3 ether);
    }
    
    function test_RevertWhen_ReleasingCompletedFunds() public {
        // Make a donation first
        uint256 donationAmount = 10 ether;
        vm.deal(donor, donationAmount);
        vm.prank(donor);
        fundPool.donate{value: donationAmount}(ngo);
        
        uint256 fundId = 1;
        
        // Release all funds
        vm.prank(tracker);
        fundPool.releaseFunds(fundId);
        
        // Try to release again
        vm.prank(tracker);
        vm.expectRevert("Funds already completed");
        fundPool.releaseFunds(fundId);
    }
}
