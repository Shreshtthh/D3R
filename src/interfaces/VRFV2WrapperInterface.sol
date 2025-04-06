// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface VRFV2WrapperInterface {
    function lastRequestId() external view returns (uint256);

    function calculateRequestPrice(uint32 _callbackGasLimit) external view returns (uint256);

    function requestRandomness(uint32 _callbackGasLimit, uint16 _requestConfirmations, uint32 _numWords)
        external
        payable
        returns (uint256 requestId);
}
