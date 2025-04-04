// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "./FundPool.sol";

contract DonationTracker is Ownable {
    using Strings for uint256;
    
    FundPool public fundPool;

    struct Report {
        uint256 fundId;
        uint256 milestoneIndex;
        string description;
        string proofCID; // IPFS content ID for proof documents
        bool approved;
    }

    // fundId => milestoneIndex => Report
    mapping(uint256 => mapping(uint256 => Report)) public reports;
    
    event ReportSubmitted(uint256 indexed fundId, uint256 indexed milestoneIndex, string description, string proofCID);
    event ReportApproved(uint256 indexed fundId, uint256 indexed milestoneIndex);
    event ReportRejected(uint256 indexed fundId, uint256 indexed milestoneIndex, string reason);

    constructor(address _fundPool) Ownable(msg.sender) {
        fundPool = FundPool(_fundPool);
    }

    function submitReport(
        uint256 _fundId, 
        uint256 _milestoneIndex, 
        string memory _description, 
        string memory _proofCID
    ) external {
        require(bytes(_proofCID).length > 0, "Proof CID required");
        
        reports[_fundId][_milestoneIndex] = Report(
            _fundId, 
            _milestoneIndex,
            _description, 
            _proofCID,
            false
        );
        
        emit ReportSubmitted(_fundId, _milestoneIndex, _description, _proofCID);
    }

    function approveReport(uint256 _fundId, uint256 _milestoneIndex) external onlyOwner {
        Report storage report = reports[_fundId][_milestoneIndex];
        require(bytes(report.description).length > 0, "Report does not exist");
        require(!report.approved, "Report already approved");
        
        report.approved = true;
        
        // Release funds for this milestone
        fundPool.releaseMilestoneFunds(_fundId, _milestoneIndex);
        
        emit ReportApproved(_fundId, _milestoneIndex);
    }
    
    function rejectReport(uint256 _fundId, uint256 _milestoneIndex, string memory _reason) external onlyOwner {
        Report storage report = reports[_fundId][_milestoneIndex];
        require(bytes(report.description).length > 0, "Report does not exist");
        require(!report.approved, "Report already approved");
        
        emit ReportRejected(_fundId, _milestoneIndex, _reason);
    }
    
    // Legacy support function for older funds without milestones
    function approveReportLegacy(uint256 _fundId) external onlyOwner {
        Report storage report = reports[_fundId][0];
        report.approved = true;
        fundPool.releaseFunds(_fundId);
        emit ReportApproved(_fundId, 0);
    }
    
    function getReportDetails(uint256 _fundId, uint256 _milestoneIndex) external view returns (
        string memory description,
        string memory proofCID,
        bool approved
    ) {
        Report storage report = reports[_fundId][_milestoneIndex];
        return (report.description, report.proofCID, report.approved);
    }
}
