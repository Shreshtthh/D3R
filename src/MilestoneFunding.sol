// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Replace the import with our local interface
import "./interfaces/ChainlinkClientMock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
// Replace ReentrancyGuard with inline implementation
import "./interfaces/ReentrancyGuardSimple.sol";
import "./NGORegistry.sol";
import "./IPFSVerifier.sol";

/**
 * @title MilestoneFunding
 * @dev Smart contract for milestone-based NGO funding with verification
 */
contract MilestoneFunding is ChainlinkClientMock, Ownable, ReentrancyGuardSimple {
    using Chainlink for Chainlink.Request;

    struct Milestone {
        string description;
        string verificationType; // "receipts", "geo-tagged", "medical", "audit"
        uint256 fundPercentage;
        bool isCompleted;
        string proofCID; // IPFS Content ID for verification proofs
        uint256 verificationTimestamp;
    }

    struct Project {
        address ngoAddress;
        string name;
        string description;
        uint256 totalFunding;
        uint256 releasedFunding;
        uint256 milestonesCompleted;
        bool isActive;
        mapping(uint256 => Milestone) milestones;
        uint256 milestoneCount;
    }

    NGORegistry public ngoRegistry;
    IPFSVerifier public ipfsVerifier;
    mapping(uint256 => Project) public projects;
    uint256 public projectCount;
    
    // Chainlink oracle details
    address private oracle;
    bytes32 private verificationJobId;
    uint256 private fee;
    
    // Events
    event ProjectCreated(uint256 indexed projectId, address indexed ngoAddress, string name, uint256 totalFunding);
    event MilestoneAdded(uint256 indexed projectId, uint256 indexed milestoneId, string description, uint256 fundPercentage);
    event ProofSubmitted(uint256 indexed projectId, uint256 indexed milestoneId, string proofCID);
    event MilestoneCompleted(uint256 indexed projectId, uint256 indexed milestoneId, uint256 fundingReleased);
    event FundsReleased(uint256 indexed projectId, address indexed ngoAddress, uint256 amount);

    constructor(address _oracle, bytes32 _jobId, uint256 _fee, address _ngoRegistry) Ownable(msg.sender) {
        setPublicChainlinkToken();
        oracle = _oracle;
        verificationJobId = _jobId;
        fee = _fee;
        ngoRegistry = NGORegistry(_ngoRegistry);
    }
    
    /**
     * @dev Update NGO Registry address
     * @param _ngoRegistry New NGO registry contract address
     */
    function updateNGORegistry(address _ngoRegistry) external onlyOwner {
        ngoRegistry = NGORegistry(_ngoRegistry);
    }
    
    /**
     * @dev Set the IPFS verifier contract
     * @param _ipfsVerifier Address of the IPFS verifier contract
     */
    function setIPFSVerifier(address _ipfsVerifier) external onlyOwner {
        ipfsVerifier = IPFSVerifier(_ipfsVerifier);
    }
    
    /**
     * @dev Creates a new project with milestone-based funding
     * @param _ngoAddress The address of the NGO
     * @param _name Project name
     * @param _description Project description
     */
    function createProject(
        address _ngoAddress,
        string memory _name,
        string memory _description
    ) external payable onlyOwner {
        require(msg.value > 0, "Must fund the project");
        // Add verification that NGO is registered
        require(ngoRegistry.isVerified(_ngoAddress), "NGO is not verified");
        
        uint256 projectId = projectCount;
        Project storage project = projects[projectId];
        project.ngoAddress = _ngoAddress;
        project.name = _name;
        project.description = _description;
        project.totalFunding = msg.value;
        project.isActive = true;
        
        projectCount++;
        emit ProjectCreated(projectId, _ngoAddress, _name, msg.value);
    }
    
    /**
     * @dev Add a milestone to an existing project
     * @param _projectId ID of the project
     * @param _description Description of the milestone
     * @param _verificationType Type of verification required
     * @param _fundPercentage Percentage of total funds to release (1-100)
     */
    function addMilestone(
        uint256 _projectId,
        string memory _description,
        string memory _verificationType,
        uint256 _fundPercentage
    ) external onlyOwner {
        require(_projectId < projectCount, "Project does not exist");
        require(_fundPercentage > 0 && _fundPercentage <= 100, "Invalid fund percentage");
        
        Project storage project = projects[_projectId];
        require(project.isActive, "Project is not active");
        
        // Check that total percentage doesn't exceed 100%
        uint256 totalPercentage = _fundPercentage;
        for(uint i = 0; i < project.milestoneCount; i++) {
            totalPercentage += project.milestones[i].fundPercentage;
        }
        require(totalPercentage <= 100, "Total milestone funding exceeds 100%");
        
        uint256 milestoneId = project.milestoneCount;
        project.milestones[milestoneId] = Milestone({
            description: _description,
            verificationType: _verificationType,
            fundPercentage: _fundPercentage,
            isCompleted: false,
            proofCID: "",
            verificationTimestamp: 0
        });
        
        project.milestoneCount++;
        emit MilestoneAdded(_projectId, milestoneId, _description, _fundPercentage);
    }
    
    /**
     * @dev Submit proof for a milestone
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     * @param _proofCID IPFS Content ID with proof documentation
     */
    function submitMilestoneProof(
        uint256 _projectId,
        uint256 _milestoneId,
        string memory _proofCID
    ) external {
        require(_projectId < projectCount, "Project does not exist");
        Project storage project = projects[_projectId];
        
        require(msg.sender == project.ngoAddress, "Only the NGO can submit proof");
        require(_milestoneId < project.milestoneCount, "Milestone does not exist");
        require(!project.milestones[_milestoneId].isCompleted, "Milestone already completed");
        require(bytes(_proofCID).length > 0, "Invalid proof CID");
        
        // Register the document with IPFS verifier if available
        if (address(ipfsVerifier) != address(0)) {
            ipfsVerifier.registerDocument(_proofCID);
        }
        
        project.milestones[_milestoneId].proofCID = _proofCID;
        project.milestones[_milestoneId].verificationTimestamp = block.timestamp;
        
        emit ProofSubmitted(_projectId, _milestoneId, _proofCID);
        
        // Request verification through Chainlink if oracle is configured
        if (oracle != address(0)) {
            requestMilestoneVerification(_projectId, _milestoneId);
        }
    }
    
    /**
     * @dev Request verification of milestone proof via Chainlink
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     */
    function requestMilestoneVerification(uint256 _projectId, uint256 _milestoneId) internal {
        Project storage project = projects[_projectId];
        Milestone storage milestone = project.milestones[_milestoneId];
        
        Chainlink.Request memory req = buildChainlinkRequest(
            verificationJobId, 
            address(this), 
            this.fulfillMilestoneVerification.selector
        );
        
        req.add("projectId", uint256ToString(_projectId));
        req.add("milestoneId", uint256ToString(_milestoneId));
        req.add("proofCID", milestone.proofCID);
        req.add("verificationType", milestone.verificationType);
        
        // Send the request to the oracle
        sendChainlinkRequestTo(oracle, req, fee);
    }
    
    /**
     * @dev Callback function for Chainlink oracle responses
     * @param _requestId The request ID
     * @param _verified Whether the milestone was verified
     */
    function fulfillMilestoneVerification(bytes32 _requestId, bool _verified) external recordChainlinkFulfillment(_requestId) {
        // Extract the project and milestone IDs from the request
        // In a real implementation, you would store the request details to retrieve here
        
        // If verification was successful, automatically approve the milestone
        // For simplicity, this is handled manually by the contract owner via approveMilestone
        // But you could add auto-approval logic here if needed
    }
    
    /**
     * @dev Convert uint256 to string (helper function for Chainlink requests)
     * @param _value The uint256 to convert
     * @return The string representation
     */
    function uint256ToString(uint256 _value) internal pure returns (string memory) {
        if (_value == 0) {
            return "0";
        }
        
        uint256 temp = _value;
        uint256 digits;
        
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        
        bytes memory buffer = new bytes(digits);
        while (_value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(_value % 10)));
            _value /= 10;
        }
        
        return string(buffer);
    }
    
    /**
     * @dev Approve a milestone and release funds (only contract owner can call)
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     */
    function approveMilestone(uint256 _projectId, uint256 _milestoneId) external onlyOwner nonReentrant {
        require(_projectId < projectCount, "Project does not exist");
        Project storage project = projects[_projectId];
        require(_milestoneId < project.milestoneCount, "Milestone does not exist");
        require(!project.milestones[_milestoneId].isCompleted, "Milestone already completed");
        require(bytes(project.milestones[_milestoneId].proofCID).length > 0, "No proof submitted");
        
        // Calculate amount to release
        uint256 amountToRelease = (project.totalFunding * project.milestones[_milestoneId].fundPercentage) / 100;
        
        // Update state
        project.milestones[_milestoneId].isCompleted = true;
        project.milestonesCompleted++;
        project.releasedFunding += amountToRelease;
        
        // Mark project as completed if all milestones are done
        if (project.milestonesCompleted == project.milestoneCount) {
            project.isActive = false;
        }
        
        // Transfer funds
        (bool success, ) = payable(project.ngoAddress).call{value: amountToRelease}("");
        require(success, "Fund transfer failed");
        
        emit MilestoneCompleted(_projectId, _milestoneId, amountToRelease);
        emit FundsReleased(_projectId, project.ngoAddress, amountToRelease);
    }
    
    /**
     * @dev Get project details
     * @param _projectId ID of the project
     * @return ngoAddress Address of the NGO
     * @return name Name of the project
     * @return description Description of the project
     * @return totalFunding Total funding amount
     * @return releasedFunding Amount of funding released
     * @return milestonesCompleted Number of completed milestones
     * @return milestoneCount Total number of milestones
     * @return isActive Whether the project is active
     */
    function getProjectDetails(uint256 _projectId) external view returns (
        address ngoAddress,
        string memory name,
        string memory description,
        uint256 totalFunding,
        uint256 releasedFunding,
        uint256 milestonesCompleted,
        uint256 milestoneCount,
        bool isActive
    ) {
        require(_projectId < projectCount, "Project does not exist");
        Project storage project = projects[_projectId];
        
        return (
            project.ngoAddress,
            project.name,
            project.description,
            project.totalFunding,
            project.releasedFunding,
            project.milestonesCompleted,
            project.milestoneCount,
            project.isActive
        );
    }
    
    /**
     * @dev Get milestone details
     * @param _projectId ID of the project
     * @param _milestoneId ID of the milestone
     * @return description Description of the milestone
     * @return verificationType Type of verification required
     * @return fundPercentage Percentage of funds to release
     * @return isCompleted Whether the milestone is completed
     * @return proofCID IPFS CID of the proof
     * @return verificationTimestamp Timestamp of verification
     */
    function getMilestoneDetails(uint256 _projectId, uint256 _milestoneId) external view returns (
        string memory description,
        string memory verificationType,
        uint256 fundPercentage,
        bool isCompleted,
        string memory proofCID,
        uint256 verificationTimestamp
    ) {
        require(_projectId < projectCount, "Project does not exist");
        Project storage project = projects[_projectId];
        require(_milestoneId < project.milestoneCount, "Milestone does not exist");
        
        Milestone storage milestone = project.milestones[_milestoneId];
        
        return (
            milestone.description,
            milestone.verificationType,
            milestone.fundPercentage,
            milestone.isCompleted,
            milestone.proofCID,
            milestone.verificationTimestamp
        );
    }
}