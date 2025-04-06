// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "forge-std/Test.sol";
import "../src/MilestoneFunding.sol";
import "../src/NGORegistry.sol";
import "../src/IPFSVerifier.sol";
import "./mocks/OracleMock.sol";

contract MilestoneFundingTest is Test {
    MilestoneFunding public funding;
    NGORegistry public ngoRegistry;
    IPFSVerifier public ipfsVerifier;
    OracleMock public oracle;

    address public owner;
    address public ngo;
    address public user;
    address public nonOwner;

    bytes32 public jobId = "4c7b7ffb66b344faaa64d1fb";
    uint256 public fee = 0.1 ether;

    event ProjectCreated(uint256 indexed projectId, address indexed ngoAddress, string name, uint256 totalFunding);
    event MilestoneAdded(
        uint256 indexed projectId, uint256 indexed milestoneId, string description, uint256 fundPercentage
    );
    event ProofSubmitted(uint256 indexed projectId, uint256 indexed milestoneId, string proofCID);
    event MilestoneCompleted(uint256 indexed projectId, uint256 indexed milestoneId, uint256 fundingReleased);
    event FundsReleased(uint256 indexed projectId, address indexed ngoAddress, uint256 amount);

    function setUp() public {
        owner = address(this);
        ngo = address(0x123);
        user = address(0x456);
        nonOwner = address(0x789);

        // Deploy NGORegistry
        ngoRegistry = new NGORegistry(owner);

        // Register and verify NGO
        vm.prank(ngo);
        ngoRegistry.registerNGO("Test NGO", "https://testngo.org", "contact@testngo.org");
        ngoRegistry.verifyNGO(ngo, true);

        // Deploy mock Oracle
        oracle = new OracleMock(address(0));

        // Deploy MilestoneFunding - using try/catch to handle potential errors
        try new MilestoneFunding(address(oracle), jobId, fee, address(ngoRegistry)) returns (
            MilestoneFunding milestoneFunding
        ) {
            funding = milestoneFunding;
        } catch Error(string memory reason) {
            console.log("Failed to deploy MilestoneFunding:", reason);
            revert(reason);
        }

        // Deploy IPFSVerifier
        ipfsVerifier = new IPFSVerifier();

        // Set IPFS verifier
        funding.setIPFSVerifier(address(ipfsVerifier));

        // Fund the contract for testing
        vm.deal(address(this), 100 ether);
    }

    function testDeployment() public {
        assertEq(funding.owner(), owner);
        assertEq(address(funding.ngoRegistry()), address(ngoRegistry));
    }

    function testCreateProject() public {
        string memory projectName = "Disaster Relief Project";
        string memory projectDesc = "Helping victims of the recent earthquake";
        uint256 fundAmount = 10 ether;

        vm.expectEmit(true, true, false, true);
        emit ProjectCreated(0, ngo, projectName, fundAmount);
        funding.createProject{value: fundAmount}(ngo, projectName, projectDesc);

        (
            address projectNgo,
            string memory name,
            string memory description,
            uint256 totalFunding,
            uint256 releasedFunding,
            uint256 milestonesCompleted,
            uint256 milestoneCount,
            bool isActive
        ) = funding.getProjectDetails(0);

        assertEq(projectNgo, ngo);
        assertEq(name, projectName);
        assertEq(description, projectDesc);
        assertEq(totalFunding, fundAmount);
        assertEq(releasedFunding, 0);
        assertEq(milestonesCompleted, 0);
        assertEq(milestoneCount, 0);
        assertTrue(isActive);
    }

    function test_RevertWhen_CreatingProjectWithZeroFunding() public {
        vm.expectRevert("Must fund the project");
        funding.createProject(ngo, "Zero Fund Project", "This should fail");
    }

    function test_RevertWhen_CreatingProjectForUnverifiedNGO() public {
        vm.expectRevert("NGO is not verified");
        funding.createProject{value: 1 ether}(nonOwner, "Invalid NGO Project", "This should fail");
    }

    function test_RevertIf_NonOwnerCreatesProject() public {
        vm.deal(nonOwner, 1 ether); // Give some ETH to nonOwner
        vm.prank(nonOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", nonOwner));
        funding.createProject{value: 1 ether}(ngo, "Unauthorized Project", "This should fail");
    }

    function testAddMilestone() public {
        // Create a project first
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing milestones");

        uint256 projectId = 0;
        string memory milestoneDesc = "First milestone";
        string memory verificationType = "receipts";
        uint256 fundPercentage = 30;

        vm.expectEmit(true, true, false, true);
        emit MilestoneAdded(projectId, 0, milestoneDesc, fundPercentage);
        funding.addMilestone(projectId, milestoneDesc, verificationType, fundPercentage);

        (
            string memory description,
            string memory vType,
            uint256 percentage,
            bool isCompleted,
            string memory proofCID,
            uint256 verificationTimestamp
        ) = funding.getMilestoneDetails(projectId, 0);

        assertEq(description, milestoneDesc);
        assertEq(vType, verificationType);
        assertEq(percentage, fundPercentage);
        assertFalse(isCompleted);
        assertEq(proofCID, "");
        assertEq(verificationTimestamp, 0);
    }

    function test_RevertWhen_AddingMilestoneWithInvalidFundPercentage() public {
        // Create a project first
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing milestones");

        uint256 projectId = 0;
        // Try with 0% - should fail
        vm.expectRevert("Invalid fund percentage");
        funding.addMilestone(projectId, "Invalid milestone", "receipts", 0);

        // Try with 101% - should fail
        vm.expectRevert("Invalid fund percentage");
        funding.addMilestone(projectId, "Invalid milestone", "receipts", 101);
    }

    function test_RevertWhen_AddingMilestoneExceedingTotal() public {
        // Create a project first
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing milestones");

        uint256 projectId = 0;
        // Add two milestones that add up to 90%
        funding.addMilestone(projectId, "First milestone", "receipts", 60);
        funding.addMilestone(projectId, "Second milestone", "receipts", 30);

        // Adding a milestone for 20% would exceed 100% - should fail
        vm.expectRevert("Total milestone funding exceeds 100%");
        funding.addMilestone(projectId, "Third milestone", "receipts", 20);
    }

    function test_RevertWhen_AddingMilestoneToNonExistentProject() public {
        vm.expectRevert("Project does not exist");
        funding.addMilestone(999, "Invalid project", "receipts", 30); // Should fail
    }

    function testSubmitMilestoneProof() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing proofs");

        uint256 projectId = 0;
        // Add a milestone
        funding.addMilestone(projectId, "First milestone", "receipts", 30);

        string memory proofCID = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";

        // Submit proof
        vm.prank(ngo);
        vm.expectEmit(true, true, false, true);
        emit ProofSubmitted(projectId, 0, proofCID);
        funding.submitMilestoneProof(projectId, 0, proofCID);

        // Verify proof was stored
        (,,,, string memory storedCID, uint256 timestamp) = funding.getMilestoneDetails(projectId, 0);
        assertEq(storedCID, proofCID);
        assertTrue(timestamp > 0);

        // Verify document was registered with IPFS verifier
        (address submitter,,) = ipfsVerifier.getDocumentDetails(proofCID);
        assertEq(submitter, address(funding));
    }

    function test_RevertWhen_NonNGOSubmitsProof() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing proofs");

        // Add a milestone
        funding.addMilestone(0, "First milestone", "receipts", 30);

        // Try to submit proof as non-NGO
        vm.prank(nonOwner);
        vm.expectRevert("Only the NGO can submit proof");
        funding.submitMilestoneProof(0, 0, "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx"); // Should fail
    }

    function test_RevertWhen_SubmittingEmptyCID() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing proofs");

        // Add a milestone
        funding.addMilestone(0, "First milestone", "receipts", 30);

        // Try to submit empty CID
        vm.prank(ngo);
        vm.expectRevert("Invalid proof CID");
        funding.submitMilestoneProof(0, 0, ""); // Should fail
    }

    function testApproveMilestone() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing approvals");

        // Add a milestone
        uint256 projectId = 0;
        uint256 milestoneId = 0;
        uint256 fundPercentage = 30;
        funding.addMilestone(projectId, "First milestone", "receipts", fundPercentage);

        // Submit proof
        string memory proofCID = "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx";
        vm.prank(ngo);
        funding.submitMilestoneProof(projectId, milestoneId, proofCID);

        // Record initial NGO balance
        uint256 initialNgoBalance = ngo.balance;

        // Calculate expected release amount
        uint256 expectedRelease = (fundAmount * fundPercentage) / 100;

        // Approve milestone
        vm.expectEmit(true, true, false, true);
        emit MilestoneCompleted(projectId, milestoneId, expectedRelease);
        funding.approveMilestone(projectId, milestoneId);

        // Check milestone is completed
        (,,, bool isCompleted,,) = funding.getMilestoneDetails(projectId, milestoneId);
        assertTrue(isCompleted);

        // Check project details
        (,,,, uint256 releasedFunding, uint256 milestonesCompleted,,) = funding.getProjectDetails(projectId);
        assertEq(releasedFunding, expectedRelease);
        assertEq(milestonesCompleted, 1);

        // Check funds were transferred
        assertEq(ngo.balance - initialNgoBalance, expectedRelease);
    }

    function testMarkProjectInactiveWhenComplete() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing completion");

        // Add milestones that add up to 100%
        uint256 projectId = 0;
        funding.addMilestone(projectId, "First milestone", "receipts", 30);
        funding.addMilestone(projectId, "Second milestone", "audit", 70);

        // Submit proofs
        vm.startPrank(ngo);
        funding.submitMilestoneProof(projectId, 0, "QmZ4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYXkjGx");
        funding.submitMilestoneProof(projectId, 1, "QmANOTHER4tDuvesekSs4qM5ZBKpXiZGun7S2CYtEZRB3DYX");
        vm.stopPrank();

        // Approve milestones
        funding.approveMilestone(projectId, 0);
        funding.approveMilestone(projectId, 1);

        // Check project is inactive
        (,,,,,,, bool isActive) = funding.getProjectDetails(projectId);
        assertFalse(isActive);
    }

    function test_RevertWhen_ApprovingMilestoneWithoutProof() public {
        // Create a project
        uint256 fundAmount = 10 ether;
        funding.createProject{value: fundAmount}(ngo, "Test Project", "Project for testing approvals");

        // Add a milestone
        funding.addMilestone(0, "First milestone", "receipts", 30);

        // Try to approve without proof
        vm.expectRevert("No proof submitted");
        funding.approveMilestone(0, 0); // Should fail
    }
}
