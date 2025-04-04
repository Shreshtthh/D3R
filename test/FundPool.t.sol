// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/NGORegistry.sol";
import "../src/FundPool.sol";

contract FundPoolTest is Test {
    NGORegistry public registry;
    FundPool public fundPool;
    
    address owner = address(1);
    address ngo = address(2);
    address donor = address(3);
    address tracker = address(4);
    
    function setUp() public {
        // Deploy NGORegistry
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
        
        // Give donor some ETH
        vm.deal(donor, 10 ether);
    }
    
    function testDonate() public {
        // Donor makes a donation
        vm.prank(donor);
        fundPool.donate{value: 1 ether}(ngo);
        
        // Check fund details
        (
            address fundNgo,
            uint256 totalAmount,
            uint256 releasedAmount,
            bool completed,
            uint256 milestonesCount
        ) = fundPool.getFundDetails(1);
        
        assertEq(fundNgo, ngo);
        assertEq(totalAmount, 1 ether);
        assertEq(releasedAmount, 0);
        assertEq(completed, false);
        assertEq(milestonesCount, 0);
    }
    
    function testAddMilestone() public {
        // Donor makes a donation
        vm.prank(donor);
        fundPool.donate{value: 1 ether}(ngo);
        
        // Owner adds a milestone
        vm.prank(owner);
        fundPool.addMilestone(1, "First milestone", 0.5 ether);
        
        // Check milestone details
        (
            string memory description,
            uint256 amount,
            bool released
        ) = fundPool.getMilestone(1, 0);
        
        assertEq(description, "First milestone");
        assertEq(amount, 0.5 ether);
        assertEq(released, false);
    }
    
    function testAuthorizeTracker() public {
        vm.startPrank(owner);
        // Authorize tracker
        fundPool.setTrackerAuthorization(tracker, true);
        vm.stopPrank();
        
        // Check authorization
        bool isAuthorized = fundPool.authorizedTrackers(tracker);
        assertTrue(isAuthorized);
    }
    
    function testReleaseMilestoneFunds() public {
        // Donor makes a donation
        vm.prank(donor);
        fundPool.donate{value: 1 ether}(ngo);
        
        // Owner adds a milestone
        vm.prank(owner);
        fundPool.addMilestone(1, "First milestone", 0.5 ether);
        
        // Authorize tracker
        vm.prank(owner);
        fundPool.setTrackerAuthorization(tracker, true);
        
        // Tracker releases milestone funds
        uint256 ngoBefore = ngo.balance;
        vm.prank(tracker);
        fundPool.releaseMilestoneFunds(1, 0);
        uint256 ngoAfter = ngo.balance;
        
        // Check NGO received funds
        assertEq(ngoAfter - ngoBefore, 0.5 ether);
        
        // Check milestone is marked as released
        (
            ,
            ,
            bool released
        ) = fundPool.getMilestone(1, 0);
        
        assertTrue(released);
    }
}
