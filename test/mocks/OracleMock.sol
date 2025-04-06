// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract OracleMock {
    address public link;

    struct Request {
        address callbackAddr;
        bytes4 callbackFunc;
    }

    mapping(bytes32 => Request) public requests;

    constructor(address _link) {
        link = _link;
    }

    // Functions needed for ChainlinkDisasterOracle tests
    function fulfillOracleRequest(
        address _callbackAddr,
        bytes32 _requestId,
        bool _verified,
        uint8 _confidence,
        string memory _source
    ) external returns (bool) {
        bytes memory callData = abi.encodeWithSelector(
            bytes4(keccak256("fulfillDisasterVerification(bytes32,bool,uint8,string)")),
            _requestId,
            _verified,
            _confidence,
            _source
        );

        (bool success,) = _callbackAddr.call(callData);
        return success;
    }

    // Functions needed for MilestoneFunding tests
    function oracleRequest(
        address sender,
        uint256 payment,
        bytes32 id,
        address callbackAddress,
        bytes4 callbackFunctionId,
        uint256 nonce,
        uint256 dataVersion,
        bytes calldata data
    ) external {
        requests[id] = Request(callbackAddress, callbackFunctionId);
    }

    // Helper to simulate oracle response
    function simulateFulfill(bytes32 requestId, bool result) external {
        Request memory req = requests[requestId];
        bytes memory callData = abi.encodeWithSelector(req.callbackFunc, requestId, result);
        (bool success,) = req.callbackAddr.call(callData);
        require(success, "Callback failed");
    }
}
