// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NGORegistry.sol";
import "../src/FundPool.sol";
import "../src/DonationTracker.sol";
import "../src/ChainlinkDisasterOracle.sol";

contract DeployD3R is Script {
    function run() external {
        // Try to get private key directly
        try vm.envUint("PRIVATE_KEY") returns (uint256 privateKey) {
            // Deploy with the successfully parsed private key
            deployWithPrivateKey(privateKey);
        } catch {
            // If that fails, try adding the 0x prefix
            string memory rawKey = vm.envString("PRIVATE_KEY");
            string memory prefixedKey = string(abi.encodePacked("0x", rawKey));
            try vm.parseUint(prefixedKey) returns (uint256 privateKey) {
                console.log("Added '0x' prefix to PRIVATE_KEY. Consider updating your environment variable.");
                deployWithPrivateKey(privateKey);
            } catch {
                console.log("Error: Invalid PRIVATE_KEY format. Must be a valid hexadecimal number.");
                console.log("Example: export PRIVATE_KEY=0x123abc... or export PRIVATE_KEY=123abc...");
                revert("PRIVATE_KEY parsing failed");
            }
        }
    }
    
    function deployWithPrivateKey(uint256 deployerPrivateKey) internal {
        // Start broadcasting transactions
        vm.startBroadcast(deployerPrivateKey);
        
        // Owner address
        address owner = 0x06eDF1ee5162DAD61BC75A4e60EaEC3228DceDEe;
        
        // Deploy contracts in correct order
        console.log("Deploying NGORegistry...");
        NGORegistry registry = new NGORegistry(owner);
        console.log("NGORegistry deployed at:", address(registry));
        
        console.log("Deploying FundPool...");
        FundPool fundPool = new FundPool(address(registry));
        console.log("FundPool deployed at:", address(fundPool));
        
        console.log("Deploying DonationTracker...");
        DonationTracker tracker = new DonationTracker(address(fundPool));
        console.log("DonationTracker deployed at:", address(tracker));
        
        // Get Chainlink parameters from environment
        address linkToken = vm.envAddress("LINK_TOKEN_ADDRESS");
        address oracle = vm.envAddress("CHAINLINK_ORACLE_ADDRESS");

        // Handle the job ID
        string memory jobIdStr = vm.envString("CHAINLINK_JOB_ID");
        console.log("Original Chainlink Job ID:", jobIdStr);

        // Remove 0x prefix if present
        if (bytes(jobIdStr).length >= 2 && bytes(jobIdStr)[0] == "0" && bytes(jobIdStr)[1] == "x") {
            bytes memory jobIdBytes = bytes(jobIdStr);
            string memory trimmed = new string(jobIdBytes.length - 2);
            for (uint i = 0; i < bytes(trimmed).length; i++) {
                bytes(trimmed)[i] = jobIdBytes[i + 2];
            }
            jobIdStr = trimmed;
        }
        
        // Convert the string job ID to bytes32
        bytes32 jobId = stringToBytes32(jobIdStr);
        console.log("Job ID converted to bytes32 format");
        
        uint256 fee = vm.envUint("CHAINLINK_FEE");
        
        console.log("Deploying ChainlinkDisasterOracle...");
        ChainlinkDisasterOracle chainlinkOracle = new ChainlinkDisasterOracle(
            linkToken,
            oracle,
            jobId,
            fee
        );
        console.log("ChainlinkDisasterOracle deployed at:", address(chainlinkOracle));
        
        // Setup contract relationships
        console.log("Setting up contract relationships...");
        fundPool.setTrackerAuthorization(address(tracker), true);
        console.log("Authorized DonationTracker to release funds");
        
        // Transfer contract ownership to the specified owner if needed
        if (owner != msg.sender) {
            fundPool.transferOwnership(owner);
            tracker.transferOwnership(owner);
            chainlinkOracle.transferOwnership(owner);
            console.log("Transferred ownership of contracts to:", owner);
        }
        
        // Stop broadcasting transactions
        vm.stopBroadcast();
        
        console.log("Deployment complete!");
    }
    
    // Helper function to convert string to bytes32
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        assembly {
            // This assembly code loads the string data directly into a bytes32
            // It works for strings up to 32 bytes long
            result := mload(add(source, 32))
        }
    }
}
