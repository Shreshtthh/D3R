// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NGORegistry.sol";
import "../src/FundPool.sol";
import "../src/DonationTracker.sol";
import "../src/MilestoneFunding.sol";
import "../src/D3RProtocol.sol";

contract DeploymentTestScript is Script {
    // Contract addresses - to be set before running test
    address public ngoRegistryAddress;
    address public fundPoolAddress;
    address public donationTrackerAddress;
    address public milestoneFundingAddress;
    address public d3rProtocolAddress;
    
    // Test NGO
    address public ngo;
    
    function setUp() public {
        // Load contract addresses from environment
        try vm.envAddress("NGO_REGISTRY") returns (address addr) {
            ngoRegistryAddress = addr;
        } catch {
            revert("NGO_REGISTRY address must be set");
        }
        
        try vm.envAddress("FUND_POOL") returns (address addr) {
            fundPoolAddress = addr;
        } catch {
            revert("FUND_POOL address must be set");
        }
        
        try vm.envAddress("DONATION_TRACKER") returns (address addr) {
            donationTrackerAddress = addr;
        } catch {
            revert("DONATION_TRACKER address must be set");
        }
        
        try vm.envAddress("MILESTONE_FUNDING") returns (address addr) {
            milestoneFundingAddress = addr;
        } catch {
            revert("MILESTONE_FUNDING address must be set");
        }
        
        try vm.envAddress("D3R_PROTOCOL") returns (address addr) {
            d3rProtocolAddress = addr;
        } catch {
            revert("D3R_PROTOCOL address must be set");
        }
        
        // Test NGO address - by default use the script invoker's address
        try vm.envAddress("TEST_NGO") returns (address addr) {
            ngo = addr;
        } catch {
            ngo = msg.sender;
        }
    }
    
    function run() external {
        uint256 deployerPrivateKey;
        try vm.envUint("PRIVATE_KEY") returns (uint256 pk) {
            deployerPrivateKey = pk;
        } catch {
            revert("Failed to load PRIVATE_KEY.");
        }
        
        // Start test
        vm.startBroadcast(deployerPrivateKey);
        console.log("Starting deployment test with deployer:", vm.addr(deployerPrivateKey));
        
        // Connect to deployed contracts
        NGORegistry ngoRegistry = NGORegistry(ngoRegistryAddress);
        FundPool fundPool = FundPool(fundPoolAddress);
        DonationTracker donationTracker = DonationTracker(donationTrackerAddress);
        MilestoneFunding milestoneFunding = MilestoneFunding(milestoneFundingAddress);
        D3RProtocol d3rProtocol = D3RProtocol(d3rProtocolAddress);
        
        // Test 1: Register and verify an NGO
        ngoRegistry.registerNGO("Test NGO", "https://testngo.org", "contact@testngo.org");
        console.log("Registered test NGO at address:", ngo);
        
        ngoRegistry.verifyNGO(ngo, true);
        console.log("Verified test NGO");
        
        // Test 2: Create a fund for the NGO
        uint256 fundAmount = 0.1 ether;
        fundPool.donate{value: fundAmount}(ngo);
        uint256 newFundId = fundPool.fundCount();
        console.log("Created fund with ID:", newFundId);
        
        // Test 3: Add a milestone to the fund
        fundPool.addMilestone(newFundId, "First milestone", fundAmount / 2);
        console.log("Added milestone to fund");
        
        // Test 4: Submit a report for the milestone
        donationTracker.submitReport(newFundId, 0, "Progress report for milestone 0", "QmTest123456789");
        console.log("Submitted milestone report");
        
        // Test 5: Approve report and release funds
        donationTracker.approveReport(newFundId, 0);
        console.log("Approved milestone and released funds");
        
        // Test summary
        console.log("\nTest completed successfully!");
        console.log("Verified test NGO:", ngo);
        console.log("Created fund with ID:", newFundId);
        console.log("Milestone funds released successfully");
        
        vm.stopBroadcast();
    }
}
