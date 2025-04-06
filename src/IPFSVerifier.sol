// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title IPFSVerifier
 * @dev Helper contract for verifying IPFS document hashes
 */
contract IPFSVerifier {
    // Storage for document validation
    mapping(string => bool) private validDocumentHashes;
    mapping(string => address) private documentSubmitters;
    mapping(string => uint256) private documentTimestamps;
    
    // Events
    event DocumentRegistered(string cid, address indexed submitter);
    event DocumentVerified(string cid, address indexed verifier);
    
    /**
     * @dev Register a document hash in the contract
     * @param _cid IPFS Content ID of the document
     */
    function registerDocument(string memory _cid) external {
        require(bytes(_cid).length > 0, "Invalid IPFS CID");
        require(documentSubmitters[_cid] == address(0), "Document already registered");
        
        documentSubmitters[_cid] = msg.sender;
        documentTimestamps[_cid] = block.timestamp;
        
        emit DocumentRegistered(_cid, msg.sender);
    }
    
    /**
     * @dev Verify a document was properly submitted
     * @param _cid IPFS Content ID of the document to verify
     */
    function verifyDocument(string memory _cid) external {
        require(documentSubmitters[_cid] != address(0), "Document not registered");
        validDocumentHashes[_cid] = true;
        
        emit DocumentVerified(_cid, msg.sender);
    }
    
    /**
     * @dev Check if a document is verified
     * @param _cid IPFS Content ID to check
     * @return True if the document is verified
     */
    function isDocumentVerified(string memory _cid) external view returns (bool) {
        return validDocumentHashes[_cid];
    }
    
    /**
     * @dev Get document submission details
     * @param _cid IPFS Content ID
     * @return submitter Address that submitted the document
     * @return timestamp Time when the document was submitted
     * @return verified Whether the document is verified
     */
    function getDocumentDetails(string memory _cid) external view returns (
        address submitter,
        uint256 timestamp,
        bool verified
    ) {
        return (
            documentSubmitters[_cid],
            documentTimestamps[_cid],
            validDocumentHashes[_cid]
        );
    }
}