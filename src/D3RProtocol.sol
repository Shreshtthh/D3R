// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./NGORegistry.sol";
import "./FundPool.sol";
import "./DonationTracker.sol";
import "./MilestoneFunding.sol";
import "./IPFSVerifier.sol";
import "./ChainlinkDisasterOracle.sol";

/**
 * @title D3RProtocol
 * @dev Main contract that orchestrates the D3R protocol components
 */
contract D3RProtocol is Ownable {
    // Component contracts
    NGORegistry public ngoRegistry;
    FundPool public fundPool;
    DonationTracker public donationTracker;
    MilestoneFunding public milestoneFunding;
    IPFSVerifier public ipfsVerifier;
    ChainlinkDisasterOracle public disasterOracle;
    
    // Events
    event ComponentUpdated(string name, address indexed component);
    
    constructor(
        address _ngoRegistry,
        address _fundPool,
        address _donationTracker,
        address _milestoneFunding,
        address _ipfsVerifier,
        address _disasterOracle
    ) Ownable(msg.sender) {
        ngoRegistry = NGORegistry(_ngoRegistry);
        fundPool = FundPool(_fundPool);
        donationTracker = DonationTracker(_donationTracker);
        milestoneFunding = MilestoneFunding(_milestoneFunding);
        ipfsVerifier = IPFSVerifier(_ipfsVerifier);
        disasterOracle = ChainlinkDisasterOracle(_disasterOracle);
    }
    
    /**
     * @dev Create a new disaster relief project with milestones
     */
    function createReliefProject(
        string memory _disasterId,
        address _ngoAddress, 
        string memory _name, 
        string memory _description,
        uint256 _value
    ) external payable onlyOwner {
        // Verify the disaster is confirmed
        (bool verified, uint8 confidence, , ) = disasterOracle.getDisasterVerification(_disasterId);
        require(verified && confidence >= 70, "Disaster not verified with sufficient confidence");
        
        // Create the milestone project
        milestoneFunding.createProject{value: _value}(_ngoAddress, _name, _description);
    }
    
    /**
     * @dev Update component contract addresses
     */
    function updateComponent(string memory _name, address _component) external onlyOwner {
        if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("ngoRegistry"))) {
            ngoRegistry = NGORegistry(_component);
        } else if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("fundPool"))) {
            fundPool = FundPool(_component);
        } else if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("donationTracker"))) {
            donationTracker = DonationTracker(_component);
        } else if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("milestoneFunding"))) {
            milestoneFunding = MilestoneFunding(_component);
        } else if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("ipfsVerifier"))) {
            ipfsVerifier = IPFSVerifier(_component);
        } else if (keccak256(abi.encodePacked(_name)) == keccak256(abi.encodePacked("disasterOracle"))) {
            disasterOracle = ChainlinkDisasterOracle(_component);
        } else {
            revert("Invalid component name");
        }
        
        emit ComponentUpdated(_name, _component);
    }
}
