// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

// Define the Chainlink library outside of the contract
library Chainlink {
    struct Request {
        bytes32 id;
        address callbackAddress;
        bytes4 callbackFunctionId;
    }

    function add(Request memory _req, string memory _key, string memory _value) internal pure {
        // This would store the key/value pair in a real implementation
        // For mock purposes, we just need the function signature
    }
}

/**
 * @title Chainlink Client Mock
 * @dev A simplified version of the Chainlink Client for testing
 */
contract ChainlinkClientMock {
    // Mocks for Chainlink Client functionality
    address private chainlinkToken;
    address private oracle;
    uint256 private requestCount = 1;
    mapping(bytes32 => address) private pendingRequests;

    constructor() {
        // Default dummy values
        chainlinkToken = address(0);
    }

    // Function for tests to set the chainlink token address
    function setChainlinkToken(address _chainlinkToken) internal {
        chainlinkToken = _chainlinkToken;
    }

    // Function for tests to get the token
    function chainlinkTokenAddress() internal view returns (address) {
        return chainlinkToken;
    }

    // Mock for building a request
    function buildChainlinkRequest(bytes32 _jobId, address _callbackAddr, bytes4 _callbackFuncId)
        internal
        pure
        returns (Chainlink.Request memory)
    {
        Chainlink.Request memory req;
        req.id = _jobId;
        req.callbackAddress = _callbackAddr;
        req.callbackFunctionId = _callbackFuncId;
        return req;
    }

    // Mock for sending a request
    function sendChainlinkRequestTo(address _oracle, Chainlink.Request memory _req, uint256 _payment)
        internal
        returns (bytes32 requestId)
    {
        requestId = keccak256(abi.encodePacked(_req.id, requestCount));
        requestCount++;
        pendingRequests[requestId] = _req.callbackAddress;
        return requestId;
    }

    // Mock for fulfilling a request - needed for callback modifier
    modifier recordChainlinkFulfillment(bytes32 _requestId) {
        require(pendingRequests[_requestId] == msg.sender, "Source must be oracle");
        delete pendingRequests[_requestId];
        _;
    }

    // Mock for setting public chainlink token
    function setPublicChainlinkToken() internal {
        // Do nothing in the mock
    }
}
