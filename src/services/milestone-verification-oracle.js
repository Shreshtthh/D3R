// External Chainlink oracle service for milestone verification

const { Requester, Validator } = require('@chainlink/external-adapter');
const axios = require('axios');
const ipfsClient = require('ipfs-http-client');

// Connect to IPFS
const ipfs = ipfsClient({ 
  host: 'ipfs.infura.io', 
  port: 5001, 
  protocol: 'https' 
});

// Sample job to verify different types of proofs
const createRequest = async (input, callback) => {
  // Validate the request data
  const validator = new Validator(input, {
    projectId: ['required', 'integer'],
    milestoneId: ['required', 'integer'],
    proofCID: ['required', 'string'],
    verificationType: ['required', 'string']
  });

  if (validator.error) {
    callback(validator.error.statusCode, {
      jobRunID: input.id,
      status: 'errored',
      error: validator.error,
      data: {}
    });
    return;
  }

  const { projectId, milestoneId, proofCID, verificationType } = validator.validated.data;
  console.log(`Processing verification request for project ${projectId}, milestone ${milestoneId}, type: ${verificationType}`);

  let verificationResult = false;
  let statusMsg = '';

  try {
    // Fetch the proof data from IPFS
    console.log(`Fetching proof data from IPFS: ${proofCID}`);
    const chunks = [];
    for await (const chunk of ipfs.cat(proofCID)) {
      chunks.push(chunk);
    }
    const proofData = Buffer.concat(chunks).toString();
    const proof = JSON.parse(proofData);
    console.log(`Successfully retrieved and parsed proof data`);

    // Verify different types of proofs
    switch (verificationType) {
      case 'receipts':
        verificationResult = await verifyReceipts(proof);
        break;
      case 'geo-tagged':
        verificationResult = await verifyGeoTagged(proof);
        break;
      case 'medical':
        verificationResult = await verifyMedical(proof);
        break;
      case 'audit':
        verificationResult = await verifyAudit(proof);
        break;
      default:
        statusMsg = 'Unknown verification type';
    }

    const response = {
      verified: verificationResult,
      statusMsg: statusMsg || 'Verification completed',
      proofCID
    };

    // Return success
    callback(200, {
      jobRunID: input.id,
      data: response,
      result: verificationResult,
      statusCode: 200
    });
  } catch (error) {
    callback(500, {
      jobRunID: input.id,
      status: 'errored',
      error: error.message,
      data: {}
    });
  }
};

// Example verification functions
async function verifyReceipts(proof) {
  // Check for required receipt fields
  if (!proof.receipts || !Array.isArray(proof.receipts) || proof.receipts.length === 0) {
    return false;
  }
  
  // Verify each receipt has the required fields and a valid hash
  for (const receipt of proof.receipts) {
    if (!receipt.vendorName || !receipt.amount || !receipt.date || !receipt.itemList) {
      return false;
    }
    
    // Additional checks could be made here with external APIs
  }
  
  return true;
}

async function verifyGeoTagged(proof) {
  // Verify geo-tagged images or videos
  if (!proof.images || !Array.isArray(proof.images) || proof.images.length < 5) {
    return false;
  }
  
  // Check if images have location data
  for (const image of proof.images) {
    if (!image.latitude || !image.longitude || !image.timestamp || !image.ipfsCid) {
      return false;
    }
    
    // Verify the image location is within the disaster zone
    // This would typically use a disaster zone boundary service
  }
  
  // Verify beneficiary signatures if provided
  if (proof.signatures && Array.isArray(proof.signatures)) {
    // Verify digital signatures
  }
  
  return true;
}

async function verifyMedical(proof) {
  // Verify medical relief documentation
  if (!proof.medicalReports || !proof.doctorVerifications) {
    return false;
  }
  
  // Check for hospital certification
  if (!proof.hospitalVerification || !proof.hospitalVerification.signature) {
    return false;
  }
  
  // Additional verification with hospital registry API could be performed here
  
  return true;
}

async function verifyAudit(proof) {
  // Verify final audit reports
  if (!proof.auditReport || !proof.communityFeedback || !proof.externalAuditorVerification) {
    return false;
  }
  
  // Check for external auditor credentials
  if (!proof.externalAuditorVerification.auditorId || 
      !proof.externalAuditorVerification.signature) {
    return false;
  }
  
  // Verify with audit registry
  // Could make an API call to verify the auditor's credentials
  
  return true;
}

// Create a chainlink external adapter
// This is what Chainlink nodes will call
module.exports.createRequest = createRequest;
module.exports.handler = (event, context, callback) => {
  createRequest(event, (statusCode, data) => {
    callback(null, data);
  });
};