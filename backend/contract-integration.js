require('dotenv').config();
const { ethers } = require('ethers');
const path = require('path');
const fs = require('fs');
const { getContractAddresses } = require('../config/contracts');

// Import our IPFS upload module
const { 
    DOCUMENT_TYPES, 
    uploadFileToPinata, 
    uploadDirectoryToPinata,
    getIPFSUrl 
} = require('./upload');

// Contract ABIs - replace these paths with your actual compiled contract ABIs
const NGO_REGISTRY_ABI = require('../abis/NGORegistry.json');
const FUND_POOL_ABI = require('../abis/FundPool.json');
const MILESTONE_ABI = require('./abis/Milestone.json');
const DONATION_TRACKER_ABI = require('../abis/DonationTracker.json');
// Add Chainlink Oracle ABI
const CHAINLINK_ORACLE_ABI = require('../abis/ChainlinkOracle.json');

// Get contract addresses from config
const contractAddresses = getContractAddresses();

// Setup Ethereum connection
async function setupEthereumConnection() {
    // For local development with Hardhat/Foundry
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL || 'http://localhost:8545');
    
    // Use private key from .env file
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    
    // Initialize contract instances
    const ngoRegistry = new ethers.Contract(contractAddresses.ngoRegistry, NGO_REGISTRY_ABI, wallet);
    const fundPool = new ethers.Contract(contractAddresses.fundPool, FUND_POOL_ABI, wallet);
    const milestone = new ethers.Contract(contractAddresses.milestone, MILESTONE_ABI, wallet);
    const donationTracker = new ethers.Contract(contractAddresses.donationTracker, DONATION_TRACKER_ABI, wallet);
    // Add Chainlink Oracle contract instance
    const chainlinkOracle = new ethers.Contract(contractAddresses.chainlinkOracle, CHAINLINK_ORACLE_ABI, wallet);
    
    return { provider, wallet, ngoRegistry, fundPool, milestone, donationTracker, chainlinkOracle };
}

/**
 * Register an NGO with verification documents
 * @param {string} ngoId - Unique identifier for the NGO
 * @param {string} ngoName - Name of the NGO
 * @param {string} documentsPath - Path to the verification documents
 */
async function registerNGO(ngoId, ngoName, documentsPath) {
    try {
        // 1. Upload verification documents to IPFS
        const ipfsResult = await uploadDirectoryToPinata(
            documentsPath, 
            DOCUMENT_TYPES.NGO_VERIFICATION,
            { ngoId, ngoName }
        );
        
        console.log(`Verification documents uploaded with CID: ${ipfsResult.IpfsHash}`);
        
        // 2. Connect to the NGO Registry contract
        const { ngoRegistry } = await setupEthereumConnection();
        
        // 3. Register the NGO with the IPFS CID
        const tx = await ngoRegistry.registerNGO(
            ngoId, 
            ngoName,
            ipfsResult.IpfsHash
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`NGO registration confirmed on blockchain`);
        
        return {
            ngoId,
            documentsCID: ipfsResult.IpfsHash,
            documentsUrl: getIPFSUrl(ipfsResult.IpfsHash),
            txHash: tx.hash
        };
    } catch (error) {
        console.error('Error registering NGO:', error);
        throw error;
    }
}

/**
 * Submit milestone proof for a disaster relief project
 * @param {string} projectId - ID of the project
 * @param {number} milestoneNumber - Milestone number
 * @param {string} proofPath - Path to the proof files
 */
async function submitMilestoneProof(projectId, milestoneNumber, proofPath) {
    try {
        // 1. Upload milestone proof to IPFS
        const ipfsResult = await uploadDirectoryToPinata(
            proofPath,
            DOCUMENT_TYPES.MILESTONE_PROOF,
            { projectId, milestoneNumber }
        );
        
        console.log(`Milestone proof uploaded with CID: ${ipfsResult.IpfsHash}`);
        
        // 2. Connect to the Milestone contract
        const { milestone } = await setupEthereumConnection();
        
        // 3. Submit the proof on-chain
        const tx = await milestone.submitProof(
            projectId,
            milestoneNumber,
            ipfsResult.IpfsHash
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Milestone proof submission confirmed on blockchain`);
        
        return {
            projectId,
            milestoneNumber,
            proofCID: ipfsResult.IpfsHash,
            proofUrl: getIPFSUrl(ipfsResult.IpfsHash),
            txHash: tx.hash
        };
    } catch (error) {
        console.error('Error submitting milestone proof:', error);
        throw error;
    }
}

/**
 * Register a new disaster and upload evidence
 * @param {string} disasterId - Unique identifier for the disaster
 * @param {string} disasterName - Name/description of the disaster
 * @param {string} evidencePath - Path to the disaster evidence files
 */
async function registerDisaster(disasterId, disasterName, evidencePath) {
    try {
        // 1. Upload disaster evidence to IPFS
        const ipfsResult = await uploadDirectoryToPinata(
            evidencePath,
            DOCUMENT_TYPES.DISASTER_EVIDENCE,
            { disasterId, disasterName }
        );
        
        console.log(`Disaster evidence uploaded with CID: ${ipfsResult.IpfsHash}`);
        
        // 2. Connect to the FundPool contract
        const { fundPool } = await setupEthereumConnection();
        
        // 3. Register the disaster on-chain
        const tx = await fundPool.registerDisaster(
            disasterId,
            disasterName,
            ipfsResult.IpfsHash
        );
        
        console.log(`Transaction sent: ${tx.hash}`);
        await tx.wait();
        console.log(`Disaster registration confirmed on blockchain`);
        
        return {
            disasterId,
            evidenceCID: ipfsResult.IpfsHash,
            evidenceUrl: getIPFSUrl(ipfsResult.IpfsHash),
            txHash: tx.hash
        };
    } catch (error) {
        console.error('Error registering disaster:', error);
        throw error;
    }
}

/**
 * Request disaster verification from Chainlink Oracle
 * @param {string} disasterId - Unique identifier for the disaster
 * @param {string} disasterLocation - Location of the disaster (latitude,longitude)
 * @param {string} disasterType - Type of disaster (earthquake, flood, etc.)
 * @param {string} date - Date of the disaster occurrence
 */
async function requestDisasterVerification(disasterId, disasterLocation, disasterType, date) {
    try {
        // 1. Connect to the Chainlink Oracle contract
        const { chainlinkOracle } = await setupEthereumConnection();
        
        console.log(`Requesting verification for disaster ${disasterId}...`);
        
        // 2. Request verification from Chainlink Oracle
        const tx = await chainlinkOracle.requestDisasterVerification(
            disasterId,
            disasterLocation,
            disasterType,
            date
        );
        
        console.log(`Chainlink verification request sent: ${tx.hash}`);
        const receipt = await tx.wait();
        
        // 3. Extract request ID from events
        const requestId = receipt.events.find(e => e.event === 'DisasterVerificationRequested').args.requestId;
        console.log(`Chainlink request ID: ${requestId}`);
        
        return {
            requestId,
            txHash: tx.hash
        };
    } catch (error) {
        console.error('Error requesting disaster verification:', error);
        throw error;
    }
}

/**
 * Check verification result from Chainlink Oracle
 * @param {string} requestId - ID of the Chainlink request
 */
async function checkDisasterVerification(requestId) {
    try {
        // 1. Connect to the Chainlink Oracle contract
        const { chainlinkOracle } = await setupEthereumConnection();
        
        // 2. Get verification result
        const result = await chainlinkOracle.getVerificationResult(requestId);
        
        console.log(`Verification result for request ${requestId}:`);
        console.log(`- Verified: ${result.verified}`);
        console.log(`- Confidence: ${result.confidence}%`);
        console.log(`- Source: ${result.source}`);
        console.log(`- Timestamp: ${new Date(result.timestamp.toNumber() * 1000).toISOString()}`);
        
        return {
            requestId,
            verified: result.verified,
            confidence: result.confidence,
            source: result.source,
            timestamp: result.timestamp.toNumber()
        };
    } catch (error) {
        console.error('Error checking disaster verification:', error);
        throw error;
    }
}

/**
 * Check verification result for a specific disaster
 * @param {string} disasterId - ID of the disaster
 */
async function checkDisasterVerificationByDisasterId(disasterId) {
    try {
        // 1. Connect to the Chainlink Oracle contract
        const { chainlinkOracle } = await setupEthereumConnection();
        
        // 2. Get verification result for the disaster ID
        const result = await chainlinkOracle.getDisasterVerification(disasterId);
        
        console.log(`Verification result for disaster ${disasterId}:`);
        console.log(`- Verified: ${result.verified}`);
        console.log(`- Confidence: ${result.confidence}%`);
        console.log(`- Source: ${result.source}`);
        console.log(`- Timestamp: ${new Date(result.timestamp.toNumber() * 1000).toISOString()}`);
        
        return {
            disasterId,
            verified: result.verified,
            confidence: result.confidence,
            source: result.source,
            timestamp: result.timestamp.toNumber()
        };
    } catch (error) {
        console.error(`Error checking verification for disaster ${disasterId}:`, error);
        throw error;
    }
}

/**
 * Register a new disaster with Chainlink verification and upload evidence
 * @param {string} disasterId - Unique identifier for the disaster
 * @param {string} disasterName - Name/description of the disaster
 * @param {string} disasterLocation - Location of the disaster (latitude,longitude)
 * @param {string} disasterType - Type of disaster (earthquake, flood, etc.)
 * @param {string} date - Date of the disaster occurrence (YYYY-MM-DD)
 * @param {string} evidencePath - Path to the disaster evidence files
 */
async function registerVerifiedDisaster(disasterId, disasterName, disasterLocation, disasterType, date, evidencePath) {
    try {
        // 1. Upload disaster evidence to IPFS
        const ipfsResult = await uploadDirectoryToPinata(
            evidencePath,
            DOCUMENT_TYPES.DISASTER_EVIDENCE,
            { 
                disasterId, 
                disasterName,
                disasterLocation,
                disasterType,
                date
            }
        );
        
        console.log(`Disaster evidence uploaded with CID: ${ipfsResult.IpfsHash}`);
        
        // 2. Request Chainlink verification
        const verificationRequest = await requestDisasterVerification(
            disasterId, 
            disasterLocation,
            disasterType,
            date
        );
        
        console.log('Waiting for Chainlink verification...');
        
        // In a production environment, you would implement proper polling or use events
        // For simplicity, we'll wait a fixed time here
        await new Promise(resolve => setTimeout(resolve, 60000)); // Wait 1 minute
        
        // 3. Check verification result
        try {
            const verificationResult = await checkDisasterVerification(verificationRequest.requestId);
            
            if (verificationResult.verified) {
                console.log(`Disaster verified with ${verificationResult.confidence}% confidence`);
                
                // 4. Connect to the FundPool contract
                const { fundPool } = await setupEthereumConnection();
                
                // 5. Register the disaster on-chain with verification data
                const tx = await fundPool.registerDisaster(
                    disasterId,
                    disasterName,
                    ipfsResult.IpfsHash,
                    verificationResult.verified,
                    verificationResult.confidence,
                    verificationResult.source
                );
                
                console.log(`Transaction sent: ${tx.hash}`);
                await tx.wait();
                console.log(`Verified disaster registration confirmed on blockchain`);
                
                return {
                    disasterId,
                    evidenceCID: ipfsResult.IpfsHash,
                    evidenceUrl: getIPFSUrl(ipfsResult.IpfsHash),
                    verified: verificationResult.verified,
                    confidence: verificationResult.confidence,
                    source: verificationResult.source,
                    txHash: tx.hash
                };
            } else {
                console.log(`Disaster verification failed with ${verificationResult.confidence}% confidence`);
                throw new Error(`Disaster verification failed: Confidence ${verificationResult.confidence}%`);
            }
        } catch (error) {
            console.log("Verification not yet available or failed. Registering without verification...");
            
            // 4. Connect to the FundPool contract
            const { fundPool } = await setupEthereumConnection();
            
            // 5. Register the disaster on-chain without verification
            const tx = await fundPool.registerDisaster(
                disasterId,
                disasterName,
                ipfsResult.IpfsHash
            );
            
            console.log(`Transaction sent: ${tx.hash}`);
            await tx.wait();
            console.log(`Disaster registration confirmed on blockchain (pending verification)`);
            
            return {
                disasterId,
                evidenceCID: ipfsResult.IpfsHash,
                evidenceUrl: getIPFSUrl(ipfsResult.IpfsHash),
                verified: false,
                pendingVerification: true,
                requestId: verificationRequest.requestId,
                txHash: tx.hash
            };
        }
    } catch (error) {
        console.error('Error registering verified disaster:', error);
        throw error;
    }
}

// Export functions for use in other modules
module.exports = {
    registerNGO,
    submitMilestoneProof,
    registerDisaster,
    requestDisasterVerification,
    checkDisasterVerification,
    checkDisasterVerificationByDisasterId,
    registerVerifiedDisaster
};

// Example usage when run directly
if (require.main === module) {
    // Change these values to test with your actual data
    const ngoId = 'ngo-123';
    const ngoName = 'Example Relief Organization';
    const ngoDocsPath = path.join(__dirname, 'example-docs/ngo-verification');
    
    console.log('Registering NGO with verification documents...');
    registerNGO(ngoId, ngoName, ngoDocsPath)
        .then(result => {
            console.log('NGO Registration complete:');
            console.log(result);
        })
        .catch(err => {
            console.error('Registration failed:', err);
        });

    // Test the Chainlink integration
    const disasterId = 'hurricane-ida-2023';
    const disasterLocation = '29.951065,-90.071533'; // New Orleans
    const disasterType = 'hurricane';
    const disasterDate = '2023-08-29';
    
    console.log('Requesting disaster verification from Chainlink Oracle...');
    requestDisasterVerification(disasterId, disasterLocation, disasterType, disasterDate)
        .then(result => {
            console.log('Verification request complete:');
            console.log(result);
            
            // Wait a bit and check the result
            setTimeout(() => {
                checkDisasterVerification(result.requestId)
                    .then(verificationResult => {
                        console.log('Verification result:');
                        console.log(verificationResult);
                    })
                    .catch(err => {
                        console.error('Verification check failed:', err);
                    });
            }, 60000); // Check after 1 minute
        })
        .catch(err => {
            console.error('Verification request failed:', err);
        });
}
