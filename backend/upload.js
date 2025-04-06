require('dotenv').config();
const pinataSDK = require('@pinata/sdk');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Initialize Pinata client
const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
);

// Document types for metadata
const DOCUMENT_TYPES = {
    NGO_VERIFICATION: 'ngo-verification',
    MILESTONE_PROOF: 'milestone-proof',
    DISASTER_EVIDENCE: 'disaster-evidence',
    DONATION_RECEIPT: 'donation-receipt'
};

/**
 * Test the Pinata connection
 */
async function testPinataConnection() {
    try {
        const result = await pinata.testAuthentication();
        console.log('Pinata connection successful:', result);
        return result;
    } catch (error) {
        console.error('Pinata connection failed:', error);
        throw error;
    }
}

/**
 * Upload a single file to Pinata/IPFS
 * @param {string} filePath - Path to the file
 * @param {string} documentType - Type of document (use DOCUMENT_TYPES)
 * @param {Object} metadata - Additional metadata to include
 * @returns {Promise<Object>} - Pinata response with IPFS hash
 */
async function uploadFileToPinata(filePath, documentType, metadata = {}) {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File does not exist: ${filePath}`);
        }

        const readableStreamForFile = fs.createReadStream(filePath);
        const fileName = path.basename(filePath);
        
        const options = {
            pinataMetadata: {
                name: `${documentType}-${uuidv4().substring(0, 8)}-${fileName}`,
                keyvalues: {
                    documentType,
                    timestamp: new Date().toISOString(),
                    ...metadata
                }
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        console.log(`Uploading file ${fileName} to IPFS...`);
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);
        console.log(`File uploaded with hash: ${result.IpfsHash}`);
        
        return result;
    } catch (error) {
        console.error('Error uploading file to Pinata:', error);
        throw error;
    }
}

/**
 * Upload a directory to Pinata/IPFS
 * @param {string} directoryPath - Path to the directory
 * @param {string} documentType - Type of document (use DOCUMENT_TYPES)
 * @param {Object} metadata - Additional metadata to include
 * @returns {Promise<Object>} - Pinata response with IPFS hash
 */
async function uploadDirectoryToPinata(directoryPath, documentType, metadata = {}) {
    try {
        if (!fs.existsSync(directoryPath)) {
            throw new Error(`Directory does not exist: ${directoryPath}`);
        }

        const options = {
            pinataMetadata: {
                name: `${documentType}-${uuidv4().substring(0, 8)}`,
                keyvalues: {
                    documentType,
                    timestamp: new Date().toISOString(),
                    ...metadata
                }
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        console.log(`Uploading directory ${directoryPath} to IPFS...`);
        const result = await pinata.pinFromFS(directoryPath, options);
        console.log(`Directory uploaded with hash: ${result.IpfsHash}`);
        
        return result;
    } catch (error) {
        console.error('Error uploading directory to Pinata:', error);
        throw error;
    }
}

/**
 * Get a URL for an IPFS hash that can be used in a browser
 * @param {string} ipfsHash - The IPFS hash (CID)
 * @returns {string} - URL to access the content
 */
function getIPFSUrl(ipfsHash) {
    return `${process.env.IPFS_GATEWAY}${ipfsHash}`;
}

module.exports = {
    DOCUMENT_TYPES,
    testPinataConnection,
    uploadFileToPinata,
    uploadDirectoryToPinata,
    getIPFSUrl
};

// When run directly, test the Pinata connection
if (require.main === module) {
    testPinataConnection()
        .then(() => console.log('Pinata connection test complete'))
        .catch(() => console.error('Pinata connection test failed'));
}
