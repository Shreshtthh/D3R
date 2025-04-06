// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/NGORegistry.sol";
import "../src/FundPool.sol";
import "../src/DonationTracker.sol";
import "../src/IPFSVerifier.sol";
import "../src/ChainlinkDisasterOracle.sol";
import "../src/MilestoneFunding.sol";
import "../src/D3RProtocol.sol";

contract DeployScript is Script {
    function run() external {
        // Load Chainlink parameters with better error handling
        address linkTokenAddress;
        address oracleAddress;
        bytes32 jobId;
        uint256 fee;

        try vm.envAddress("LINK_TOKEN_ADDRESS") returns (address addr) {
            linkTokenAddress = addr;
            console.log("LINK token address:", linkTokenAddress);
        } catch {
            // Use fallback address
            linkTokenAddress = address(0x779877A7B0D9E8603169DdbD7836e478b4624789); // Default Sepolia LINK
            console.log("Warning: Using default LINK token address:", linkTokenAddress);
        }

        try vm.envAddress("ORACLE_ADDRESS") returns (address addr) {
            oracleAddress = addr;
            console.log("Oracle address:", oracleAddress);
        } catch {
            try vm.envAddress("CHAINLINK_ORACLE_ADDRESS") returns (address addr) {
                oracleAddress = addr;
                console.log("Oracle address (from CHAINLINK_ORACLE_ADDRESS):", oracleAddress);
            } catch {
                // Use deployer as fallback - we don't know the deployer address yet
                // Will be set after startBroadcast
                oracleAddress = address(0); // Temporary value
                console.log("Warning: Oracle address not set, will use deployer address");
            }
        }

        try vm.envBytes32("JOB_ID") returns (bytes32 id) {
            jobId = id;
            console.log("Job ID loaded");
        } catch {
            try vm.envString("JOB_ID") returns (string memory id) {
                jobId = stringToBytes32(id);
                console.log("Job ID loaded from string");
            } catch {
                try vm.envString("CHAINLINK_JOB_ID") returns (string memory id) {
                    jobId = stringToBytes32(id);
                    console.log("Job ID loaded from CHAINLINK_JOB_ID");
                } catch {
                    // Use fallback job ID
                    jobId = bytes32("29fa9aa13bf1468788b7cc4a500a45b8");
                    console.log("Warning: Using default job ID");
                }
            }
        }

        try vm.envUint("ORACLE_FEE") returns (uint256 value) {
            fee = value;
            console.log("Oracle fee:", fee);
        } catch {
            try vm.envUint("CHAINLINK_FEE") returns (uint256 value) {
                fee = value;
                console.log("Oracle fee (from CHAINLINK_FEE):", fee);
            } catch {
                // Use fallback fee (0.1 LINK)
                fee = 100000000000000000;
                console.log("Warning: Using default oracle fee (0.1 LINK)");
            }
        }

        // Start deployment - this will use the private key provided via --private-key flag
        // No need to explicitly load the private key in the script
        vm.startBroadcast();

        // If oracle address was not set, use the deployer address
        address deployerAddress = msg.sender;
        console.log("Deployer address:", deployerAddress);

        if (oracleAddress == address(0)) {
            oracleAddress = deployerAddress;
            console.log("Setting oracle address to deployer:", oracleAddress);
        }

        // Deploy the component contracts
        console.log("Deploying NGORegistry...");
        NGORegistry ngoRegistry = new NGORegistry(deployerAddress);
        console.log("NGORegistry deployed at:", address(ngoRegistry));

        console.log("Deploying FundPool...");
        FundPool fundPool = new FundPool(address(ngoRegistry));
        console.log("FundPool deployed at:", address(fundPool));

        console.log("Deploying DonationTracker...");
        DonationTracker donationTracker = new DonationTracker(address(fundPool));
        console.log("DonationTracker deployed at:", address(donationTracker));

        console.log("Deploying IPFSVerifier...");
        IPFSVerifier ipfsVerifier = new IPFSVerifier();
        console.log("IPFSVerifier deployed at:", address(ipfsVerifier));

        console.log("Deploying ChainlinkDisasterOracle...");
        ChainlinkDisasterOracle disasterOracle =
            new ChainlinkDisasterOracle(linkTokenAddress, oracleAddress, jobId, fee);
        console.log("ChainlinkDisasterOracle deployed at:", address(disasterOracle));

        // Deploy MilestoneFunding contract
        console.log("Deploying MilestoneFunding...");
        MilestoneFunding milestoneFunding = new MilestoneFunding(oracleAddress, jobId, fee, address(ngoRegistry));
        console.log("MilestoneFunding deployed at:", address(milestoneFunding));

        // Set the IPFS verifier in MilestoneFunding
        console.log("Setting IPFSVerifier in MilestoneFunding...");
        milestoneFunding.setIPFSVerifier(address(ipfsVerifier));
        console.log("IPFSVerifier set in MilestoneFunding");

        // Deploy the main protocol contract
        console.log("Deploying D3RProtocol...");
        D3RProtocol protocol = new D3RProtocol(
            address(ngoRegistry),
            address(fundPool),
            address(donationTracker),
            address(milestoneFunding),
            address(ipfsVerifier),
            address(disasterOracle)
        );
        console.log("D3RProtocol deployed at:", address(protocol));

        // Authorize the tracker and protocol in FundPool
        console.log("Authorizing contracts in FundPool...");
        fundPool.setTrackerAuthorization(address(donationTracker), true);
        console.log("DonationTracker authorized in FundPool");
        fundPool.setTrackerAuthorization(address(protocol), true);
        console.log("D3RProtocol authorized in FundPool");

        // Output all addresses in a standard format for easier parsing
        console.log("\n=== Contract Addresses ===");
        console.log("ngoRegistry:", address(ngoRegistry));
        console.log("fundPool:", address(fundPool));
        console.log("donationTracker:", address(donationTracker));
        console.log("milestoneFunding:", address(milestoneFunding));
        console.log("ipfsVerifier:", address(ipfsVerifier));
        console.log("disasterOracle:", address(disasterOracle));
        console.log("d3rProtocol:", address(protocol));

        console.log("\nDeployment completed successfully!");

        vm.stopBroadcast();
    }

    // Convert a string to bytes32
    function stringToBytes32(string memory source) internal pure returns (bytes32 result) {
        bytes memory tempEmptyStringTest = bytes(source);
        if (tempEmptyStringTest.length == 0) {
            return 0x0;
        }

        assembly {
            result := mload(add(source, 32))
        }
    }
}
