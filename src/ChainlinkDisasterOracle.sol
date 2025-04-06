// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// Import directly from Chainlink implementation if available
// If not, we'll use a simplified version
import "@openzeppelin/contracts/access/Ownable.sol";
// Use our simplified interfaces instead of external dependencies
import "./interfaces/LinkTokenInterface.sol";
import "./interfaces/ChainlinkRequestInterface.sol";

/**
 * @title ChainlinkDisasterOracle
 * @dev Contract that verifies disaster information using Chainlink oracles
 */
contract ChainlinkDisasterOracle is Ownable {
    // State variables
    LinkTokenInterface private immutable LINK_TOKEN;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;

    // Disaster verifications
    struct Verification {
        bool verified;
        uint8 confidence;
        string source;
        uint256 timestamp;
    }

    // Mappings
    mapping(bytes32 => Verification) public verifications; // requestId => Verification
    mapping(string => bytes32) public disasterRequests; // disasterId => requestId

    // Events
    event DisasterVerificationRequested(bytes32 indexed requestId, string disasterId);

    event DisasterVerificationFulfilled(bytes32 indexed requestId, bool verified, uint8 confidence, string source);

    /**
     * @dev Constructor initializes the contract with Chainlink parameters
     * @param _linkToken The LINK token address
     * @param _oracle The Oracle contract address
     * @param _jobId The Job ID that will verify disaster information
     * @param _fee The fee to pay to the oracle
     */
    constructor(address _linkToken, address _oracle, bytes32 _jobId, uint256 _fee) Ownable(msg.sender) {
        LINK_TOKEN = LinkTokenInterface(_linkToken);
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    /**
     * @dev Request verification of a disaster from Chainlink oracle
     * @param _disasterId Unique identifier for the disaster
     * @param _disasterLocation Geographic location of the disaster
     * @param _disasterType Type of disaster (earthquake, flood, etc.)
     * @param _date Date when the disaster occurred
     * @return requestId The ID of the request
     */
    function requestDisasterVerification(
        string memory _disasterId,
        string memory _disasterLocation,
        string memory _disasterType,
        string memory _date
    ) public returns (bytes32 requestId) {
        // Check if we have enough LINK
        require(LINK_TOKEN.balanceOf(address(this)) >= fee, "Not enough LINK to pay fee");

        // Create a unique request ID
        requestId = keccak256(abi.encodePacked(_disasterId, block.timestamp));

        // Store the request ID for this disaster ID
        disasterRequests[_disasterId] = requestId;

        // Emit the event before sending the request
        emit DisasterVerificationRequested(requestId, _disasterId);

        // Request data from the oracle - simplified version
        // In a real-world scenario with full Chainlink implementation,
        // we would use Chainlink's request model with buildOperatorRequest
        bytes memory encodedRequest = abi.encodeWithSelector(
            ChainlinkRequestInterface.oracleRequest.selector,
            address(this),
            fee,
            requestId,
            address(this),
            this.fulfillDisasterVerification.selector,
            0,
            0,
            abi.encode(_disasterId, _disasterLocation, _disasterType, _date)
        );

        // Transfer LINK and make the request
        bool success = LINK_TOKEN.transferAndCall(oracle, fee, encodedRequest);
        require(success, "Unable to transfer LINK to oracle");

        return requestId;
    }

    /**
     * @dev Callback function used by the oracle to fulfill the request
     * @param _requestId ID of the request
     * @param _verified Whether the disaster is verified
     * @param _confidence Confidence score of the verification
     * @param _source Source of the verification
     */
    function fulfillDisasterVerification(bytes32 _requestId, bool _verified, uint8 _confidence, string memory _source)
        public
    {
        // Only the oracle can fulfill requests
        require(msg.sender == oracle, "Only the oracle can fulfill");

        // Store the verification result
        verifications[_requestId] =
            Verification({verified: _verified, confidence: _confidence, source: _source, timestamp: block.timestamp});

        // Emit the event
        emit DisasterVerificationFulfilled(_requestId, _verified, _confidence, _source);
    }

    /**
     * @dev Get verification result by request ID
     * @param _requestId ID of the request
     * @return verified Whether the disaster is verified
     * @return confidence Confidence score of the verification (0-100)
     * @return source Source of the verification data
     * @return timestamp Time when the verification was recorded
     */
    function getVerificationResult(bytes32 _requestId)
        public
        view
        returns (bool verified, uint8 confidence, string memory source, uint256 timestamp)
    {
        Verification memory v = verifications[_requestId];
        return (v.verified, v.confidence, v.source, v.timestamp);
    }

    /**
     * @dev Get verification result by disaster ID
     * @param _disasterId ID of the disaster
     * @return verified Whether the disaster is verified
     * @return confidence Confidence score of the verification (0-100)
     * @return source Source of the verification data
     * @return timestamp Time when the verification was recorded
     */
    function getDisasterVerification(string memory _disasterId)
        public
        view
        returns (bool verified, uint8 confidence, string memory source, uint256 timestamp)
    {
        bytes32 requestId = disasterRequests[_disasterId];
        require(requestId != bytes32(0), "No verification request found");

        return getVerificationResult(requestId);
    }

    /**
     * @dev Update Chainlink parameters
     * @param _oracle New oracle address
     * @param _jobId New job ID
     * @param _fee New fee amount
     */
    function updateChainlinkParameters(address _oracle, bytes32 _jobId, uint256 _fee) public onlyOwner {
        oracle = _oracle;
        jobId = _jobId;
        fee = _fee;
    }

    /**
     * @dev Withdraw LINK from the contract
     */
    function withdrawLink() public onlyOwner {
        uint256 balance = LINK_TOKEN.balanceOf(address(this));
        require(balance > 0, "No LINK to withdraw");

        bool success = LINK_TOKEN.transfer(msg.sender, balance);
        require(success, "Unable to withdraw LINK");
    }
}
