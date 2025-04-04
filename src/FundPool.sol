// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
// Removing ReentrancyGuard import and implementing a simple version inline
import "./NGORegistry.sol";

contract FundPool is Ownable {
    NGORegistry public ngoRegistry;

    // Simple reentrancy guard implementation
    bool private _locked;

    modifier nonReentrant() {
        require(!_locked, "ReentrancyGuard: reentrant call");
        _locked = true;
        _;
        _locked = false;
    }

    struct Milestone {
        string description;
        uint256 amount;
        bool released;
    }

    struct Fund {
        address ngo;
        uint256 totalAmount;
        uint256 releasedAmount;
        bool completed;
        Milestone[] milestones;
    }

    mapping(uint256 => Fund) public funds;
    uint256 public fundCount;

    // Define authorized tracker contracts that can trigger fund releases
    mapping(address => bool) public authorizedTrackers;

    event DonationReceived(uint256 indexed fundId, address indexed donor, address indexed ngo, uint256 amount);
    event FundsReleased(uint256 indexed fundId, address indexed ngo, uint256 amount, uint256 milestoneIndex);
    event TrackerAuthorized(address indexed tracker, bool status);
    event MilestoneAdded(uint256 indexed fundId, string description, uint256 amount);

    constructor(address _ngoRegistry) Ownable(msg.sender) {
        ngoRegistry = NGORegistry(_ngoRegistry);
        _locked = false;
    }

    modifier onlyAuthorized() {
        require(owner() == msg.sender || authorizedTrackers[msg.sender], "Not authorized");
        _;
    }

    function setTrackerAuthorization(address _tracker, bool _status) external onlyOwner {
        authorizedTrackers[_tracker] = _status;
        emit TrackerAuthorized(_tracker, _status);
    }

    function donate(address _ngo) external payable {
        require(msg.value > 0, "Donation must be greater than 0");
        require(ngoRegistry.isVerified(_ngo), "NGO is not verified");

        fundCount++;
        // Initialize the fund without setting the milestones array
        funds[fundCount].ngo = _ngo;
        funds[fundCount].totalAmount = msg.value;
        funds[fundCount].releasedAmount = 0;
        funds[fundCount].completed = false;
        // The milestones array is automatically initialized as an empty array

        emit DonationReceived(fundCount, msg.sender, _ngo, msg.value);
    }

    function addMilestone(uint256 _fundId, string memory _description, uint256 _amount) external onlyOwner {
        Fund storage fund = funds[_fundId];
        require(!fund.completed, "Fund already completed");
        require(fund.totalAmount >= fund.releasedAmount + _amount, "Insufficient remaining funds");

        fund.milestones.push(Milestone(_description, _amount, false));
        emit MilestoneAdded(_fundId, _description, _amount);
    }

    function releaseMilestoneFunds(uint256 _fundId, uint256 _milestoneIndex) external onlyAuthorized nonReentrant {
        Fund storage fund = funds[_fundId];
        require(_milestoneIndex < fund.milestones.length, "Invalid milestone index");
        require(!fund.milestones[_milestoneIndex].released, "Milestone funds already released");

        Milestone storage milestone = fund.milestones[_milestoneIndex];
        milestone.released = true;
        fund.releasedAmount += milestone.amount;

        if (fund.releasedAmount >= fund.totalAmount) {
            fund.completed = true;
        }

        (bool success,) = payable(fund.ngo).call{value: milestone.amount}("");
        require(success, "Fund transfer failed");

        emit FundsReleased(_fundId, fund.ngo, milestone.amount, _milestoneIndex);
    }

    // Legacy method for compatibility - releases all remaining funds
    function releaseFunds(uint256 _fundId) external onlyAuthorized nonReentrant {
        Fund storage fund = funds[_fundId];
        require(!fund.completed, "Funds already completed");

        uint256 remainingAmount = fund.totalAmount - fund.releasedAmount;
        require(remainingAmount > 0, "No remaining funds to release");

        fund.releasedAmount = fund.totalAmount;
        fund.completed = true;

        (bool success,) = payable(fund.ngo).call{value: remainingAmount}("");
        require(success, "Fund transfer failed");

        emit FundsReleased(_fundId, fund.ngo, remainingAmount, type(uint256).max);
    }

    function getFundDetails(uint256 _fundId)
        external
        view
        returns (address ngo, uint256 totalAmount, uint256 releasedAmount, bool completed, uint256 milestonesCount)
    {
        Fund storage fund = funds[_fundId];
        return (fund.ngo, fund.totalAmount, fund.releasedAmount, fund.completed, fund.milestones.length);
    }

    function getMilestone(uint256 _fundId, uint256 _milestoneIndex)
        external
        view
        returns (string memory description, uint256 amount, bool released)
    {
        Fund storage fund = funds[_fundId];
        require(_milestoneIndex < fund.milestones.length, "Invalid milestone index");
        Milestone storage milestone = fund.milestones[_milestoneIndex];
        return (milestone.description, milestone.amount, milestone.released);
    }
}
