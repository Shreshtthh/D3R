// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ChainlinkDisasterOracle.sol";
import "./mocks/LinkTokenMock.sol";
import "./mocks/OracleMock.sol";

contract ChainlinkDisasterOracleTest is Test {
    ChainlinkDisasterOracle public disasterOracle;
    LinkTokenMock public linkToken;
    OracleMock public oracle;
    
    address public owner;
    address public requester;
    address public nonOwner;
    
    bytes32 public jobId;
    uint256 public fee;
    
    event DisasterVerificationRequested(bytes32 indexed requestId, string disasterId);
    event DisasterVerificationFulfilled(bytes32 indexed requestId, bool verified, uint8 confidence, string source);
    
    function setUp() public {
        owner = address(this);
        requester = address(0x123);
        nonOwner = address(0x456);
        
        // Deploy mock contracts
        linkToken = new LinkTokenMock();
        oracle = new OracleMock(address(linkToken));
        
        // Setup Chainlink parameters
        jobId = "4c7b7ffb66b344faaa64d1fb";
        fee = 0.1 ether;
        
        // Deploy ChainlinkDisasterOracle
        disasterOracle = new ChainlinkDisasterOracle(
            address(linkToken),
            address(oracle),
            jobId,
            fee
        );
        
        // Fund the oracle with LINK
        linkToken.transfer(address(disasterOracle), 10 ether);
    }
    
    function testDeployment() public {
        assertEq(disasterOracle.owner(), owner);
        assertEq(linkToken.balanceOf(address(disasterOracle)), 10 ether);
    }
    
    function testRequestDisasterVerification() public {
        string memory disasterId = "EQ-20230615-001";
        string memory location = "Port-au-Prince, Haiti";
        string memory disasterType = "earthquake";
        string memory date = "2023-06-15";
        
        // Option 1: Skip checking the event emission
        // Just call the function and verify the return value
        bytes32 requestId = disasterOracle.requestDisasterVerification(
            disasterId,
            location,
            disasterType,
            date
        );
        
        // Verify the request was recorded properly
        assertTrue(requestId != bytes32(0), "Request ID should not be empty");
    }

    // Alternative approach if you need to keep the event check
    function testRequestDisasterVerificationWithEventCheck() public {
        string memory disasterId = "EQ-20230615-001";
        string memory location = "Port-au-Prince, Haiti";
        string memory disasterType = "earthquake";
        string memory date = "2023-06-15";
        
        // We'll use a different approach to check the event
        vm.recordLogs();
        
        bytes32 requestId = disasterOracle.requestDisasterVerification(
            disasterId,
            location,
            disasterType,
            date
        );
        
        Vm.Log[] memory entries = vm.getRecordedLogs();
        bool foundEvent = false;
        
        // Look through logs for our event
        for (uint i = 0; i < entries.length; i++) {
            // This is the event signature for DisasterVerificationRequested
            bytes32 eventSignature = keccak256("DisasterVerificationRequested(bytes32,string)");
            if (entries[i].topics[0] == eventSignature) {
                // Found our event
                foundEvent = true;
                break;
            }
        }
        
        assertTrue(foundEvent, "Event DisasterVerificationRequested was not emitted");
        
        // Verify the request was recorded properly
        assertTrue(requestId != bytes32(0), "Request ID should not be empty");
    }
    
    function testRequestDisasterVerificationNoLink() public {
        // Deploy a new oracle with no LINK
        ChainlinkDisasterOracle newOracle = new ChainlinkDisasterOracle(
            address(linkToken),
            address(oracle),
            jobId,
            fee
        );
        
        string memory disasterId = "FL-20230501-002";
        string memory location = "Miami, USA";
        string memory disasterType = "flood";
        string memory date = "2023-05-01";
        
        vm.expectRevert("Not enough LINK to pay fee");
        newOracle.requestDisasterVerification(disasterId, location, disasterType, date);
    }
    
    function testFulfillDisasterVerification() public {
        string memory disasterId = "EQ-20230615-001";
        string memory location = "Port-au-Prince, Haiti";
        string memory disasterType = "earthquake";
        string memory date = "2023-06-15";
        
        // Request verification
        bytes32 requestId = disasterOracle.requestDisasterVerification(
            disasterId,
            location,
            disasterType,
            date
        );
        
        bool verified = true;
        uint8 confidence = 85;
        string memory source = "USGS";
        
        vm.expectEmit(true, false, false, true);
        emit DisasterVerificationFulfilled(requestId, verified, confidence, source);
        
        // Mock the oracle calling the callback
        vm.prank(address(oracle));
        disasterOracle.fulfillDisasterVerification(requestId, verified, confidence, source);
        
        // Check that verification data was saved
        (bool resultVerified, uint8 resultConfidence, string memory resultSource, uint256 timestamp) = 
            disasterOracle.getVerificationResult(requestId);
        
        assertEq(resultVerified, verified);
        assertEq(resultConfidence, confidence);
        assertEq(resultSource, source);
        assertTrue(timestamp > 0);
    }
    
    function testFulfillDisasterVerificationUnauthorized() public {
        bytes32 requestId = bytes32("test");
        bool verified = true;
        uint8 confidence = 85;
        string memory source = "USGS";
        
        // Try to fulfill from non-oracle address
        vm.prank(nonOwner);
        vm.expectRevert("Only the oracle can fulfill");
        disasterOracle.fulfillDisasterVerification(requestId, verified, confidence, source);
    }
    
    function testGetDisasterVerification() public {
        string memory disasterId = "EQ-20230615-001";
        string memory location = "Port-au-Prince, Haiti";
        string memory disasterType = "earthquake";
        string memory date = "2023-06-15";
        
        // Request verification
        bytes32 requestId = disasterOracle.requestDisasterVerification(
            disasterId,
            location,
            disasterType,
            date
        );
        
        bool verified = true;
        uint8 confidence = 85;
        string memory source = "USGS";
        
        // Mock the oracle calling the callback
        vm.prank(address(oracle));
        disasterOracle.fulfillDisasterVerification(requestId, verified, confidence, source);
        
        // Get verification by disaster ID
        (bool resultVerified, uint8 resultConfidence, string memory resultSource, uint256 timestamp) = 
            disasterOracle.getDisasterVerification(disasterId);
        
        assertEq(resultVerified, verified);
        assertEq(resultConfidence, confidence);
        assertEq(resultSource, source);
        assertTrue(timestamp > 0);
    }
    
    function testGetNonExistentDisasterVerification() public {
        string memory nonExistentId = "FAKE-ID-123";
        
        vm.expectRevert("No verification request found");
        disasterOracle.getDisasterVerification(nonExistentId);
    }
    
    function testUpdateChainlinkParameters() public {
        address newOracle = address(0xABC);
        bytes32 newJobId = "newjobid123456789000";
        uint256 newFee = 0.2 ether;
        
        disasterOracle.updateChainlinkParameters(newOracle, newJobId, newFee);
        
        // We need to test that these parameters are actually used
        // This would require making these parameters public or adding getters
    }
    
    function testWithdrawLink() public {
        uint256 initialBalance = linkToken.balanceOf(owner);
        uint256 contractBalance = linkToken.balanceOf(address(disasterOracle));
        
        disasterOracle.withdrawLink();
        
        assertEq(linkToken.balanceOf(owner), initialBalance + contractBalance);
        assertEq(linkToken.balanceOf(address(disasterOracle)), 0);
    }

    function test_RevertWhen_WithdrawingLinkWithZeroBalance() public {
        // Deploy a new oracle with no LINK
        ChainlinkDisasterOracle newOracle = new ChainlinkDisasterOracle(
            address(linkToken),
            address(oracle),
            jobId,
            fee
        );
        
        vm.expectRevert("No LINK to withdraw");
        newOracle.withdrawLink();
    }
}
