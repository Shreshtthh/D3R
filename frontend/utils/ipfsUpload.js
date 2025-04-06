import axios from 'axios';
import { verifyIPFSDocument } from './web3';

// IPFS Gateway URLs for retrieval
const IPFS_GATEWAYS = [
  'https://ipfs.io/ipfs/',
  'https://cloudflare-ipfs.com/ipfs/',
  'https://gateway.pinata.cloud/ipfs/'
];

/**
 * Upload file to IPFS using Pinata or other available IPFS service
 * 
 * @param {File} file - The file to upload
 * @param {string} name - Metadata name for the file
 * @param {string} description - Metadata description
 * @param {Object} additionalMetadata - Any additional metadata to store
 * @returns {Promise<{cid: string, url: string}>} - IPFS content ID and URL
 */
export const uploadToIPFS = async (file, name, description, additionalMetadata = {}) => {
  try {
    // Check if Pinata keys are configured
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API keys not configured');
    }

    // Create form data for the file upload
    const formData = new FormData();
    formData.append('file', file);
    
    // Add metadata
    const metadata = JSON.stringify({
      name: name || file.name,
      description: description,
      timestamp: Date.now(),
      ...additionalMetadata
    });
    formData.append('pinataMetadata', metadata);
    
    // Add options for Pinata
    const options = JSON.stringify({
      cidVersion: 0,
      wrapWithDirectory: false
    });
    formData.append('pinataOptions', options);
    
    // Upload to Pinata
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinFileToIPFS',
      formData,
      {
        maxBodyLength: 'Infinity',
        headers: {
          'Content-Type': `multipart/form-data;`,
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY
        }
      }
    );
    
    const cid = response.data.IpfsHash;
    const url = `${IPFS_GATEWAYS[0]}${cid}`;
    
    // For D3R protocol, we also want to verify the document on-chain
    try {
      await verifyIPFSDocument(cid);
    } catch (verificationError) {
      console.warn('On-chain verification failed, but IPFS upload was successful:', verificationError);
    }
    
    return { cid, url };
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    throw error;
  }
};

/**
 * Upload JSON metadata to IPFS
 * 
 * @param {Object} metadata - JSON metadata to upload
 * @param {string} name - Name of the metadata object
 * @returns {Promise<{cid: string, url: string}>} - IPFS content ID and URL
 */
export const uploadJSONToIPFS = async (metadata, name) => {
  try {
    // Check if Pinata keys are configured
    if (!process.env.NEXT_PUBLIC_PINATA_API_KEY || !process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY) {
      throw new Error('Pinata API keys not configured');
    }
    
    const pinataMetadata = {
      name: name || 'Relief Document Metadata',
      keyvalues: {
        timestamp: Date.now().toString()
      }
    };
    
    const pinataOptions = {
      cidVersion: 0
    };
    
    const response = await axios.post(
      'https://api.pinata.cloud/pinning/pinJSONToIPFS',
      {
        pinataMetadata,
        pinataOptions,
        pinataContent: metadata
      },
      {
        headers: {
          pinata_api_key: process.env.NEXT_PUBLIC_PINATA_API_KEY,
          pinata_secret_api_key: process.env.NEXT_PUBLIC_PINATA_SECRET_API_KEY
        }
      }
    );
    
    const cid = response.data.IpfsHash;
    const url = `${IPFS_GATEWAYS[0]}${cid}`;
    
    // For D3R protocol, we also want to verify the document on-chain
    try {
      await verifyIPFSDocument(cid);
    } catch (verificationError) {
      console.warn('On-chain verification failed, but IPFS upload was successful:', verificationError);
    }
    
    return { cid, url };
  } catch (error) {
    console.error('Error uploading JSON to IPFS:', error);
    throw error;
  }
};

/**
 * Retrieve content from IPFS, trying multiple gateways if needed
 * 
 * @param {string} cid - IPFS content ID
 * @returns {Promise<Object>} - The content from IPFS
 */
export const getFromIPFS = async (cid) => {
  let lastError = null;
  
  // Try each gateway until one works
  for (const gateway of IPFS_GATEWAYS) {
    try {
      const url = `${gateway}${cid}`;
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      lastError = error;
      console.warn(`Failed to fetch from ${gateway}${cid}:`, error.message);
      // Continue to next gateway
    }
  }
  
  // If we reach here, all gateways failed
  throw new Error(`Failed to retrieve ${cid} from IPFS: ${lastError?.message || 'Unknown error'}`);
};

/**
 * Create a disaster documentation package to be stored on IPFS
 * Useful for NGOs to submit milestone evidence
 * 
 * @param {Object} data - The disaster documentation data
 * @param {File[]} files - Array of evidence files
 * @returns {Promise<{cid: string, url: string}>} - IPFS content ID and URL for the documentation package
 */
export const createDisasterDocumentation = async (data, files = []) => {
  try {
    // Upload all files first
    const fileUploads = await Promise.all(
      files.map(file => uploadToIPFS(file, file.name, `Evidence file for ${data.disasterId || 'disaster relief'}`, {
        disasterId: data.disasterId,
        projectId: data.projectId,
        milestoneId: data.milestoneId
      }))
    );
    
    // Create metadata package that references the files
    const metadata = {
      disasterId: data.disasterId,
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      description: data.description,
      location: data.location,
      timestamp: Date.now(),
      createdBy: data.ngoAddress || 'unknown',
      evidenceFiles: fileUploads.map(upload => ({
        cid: upload.cid,
        url: upload.url,
        name: upload.name
      })),
      additionalNotes: data.notes,
      contactInfo: data.contactInfo
    };
    
    // Upload the complete metadata package
    return await uploadJSONToIPFS(metadata, `Disaster Documentation ${data.disasterId}`);
  } catch (error) {
    console.error('Error creating disaster documentation:', error);
    throw error;
  }
};

export default {
  uploadToIPFS,
  uploadJSONToIPFS,
  getFromIPFS,
  createDisasterDocumentation,
  IPFS_GATEWAYS
};
