// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract MockFundPool {
    uint256 public lastFundId;
    uint256 public lastMilestoneIndex;
    bool public releaseWasCalled;
    bool public legacyReleaseWasCalled;

    function releaseMilestoneFunds(uint256 _fundId, uint256 _milestoneIndex) external {
        lastFundId = _fundId;
        lastMilestoneIndex = _milestoneIndex;
        releaseWasCalled = true;
    }

    function releaseFunds(uint256 _fundId) external {
        lastFundId = _fundId;
        legacyReleaseWasCalled = true;
    }
}
