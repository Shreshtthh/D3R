/**
 * Test Utilities for Block-Donate DApp
 * 
 * This file contains helper functions to assist with testing
 * your blockchain donation platform.
 */

const fs = require('fs');
const path = require('path');

/**
 * Verify that the contract address in .env is valid
 * @returns {Object} Validation result
 */
function validateContractAddress() {
  try {
    // Read .env file
    const envPath = path.join(__dirname, '..', '.env');
    if (!fs.existsSync(envPath)) {
      return {
        valid: false,
        message: '.env file not found'
      };
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Extract CONTRACT_ADDRESS
    const addressMatch = envContent.match(/CONTRACT_ADDRESS=([^\r\n]+)/);
    if (!addressMatch) {
      return {
        valid: false,
        message: 'CONTRACT_ADDRESS not found in .env file'
      };
    }
    
    const contractAddress = addressMatch[1].trim();
    
    // Check if it's just a placeholder
    if (contractAddress === '0x123...' || contractAddress.includes('your_')) {
      return {
        valid: false,
        message: 'CONTRACT_ADDRESS contains a placeholder value'
      };
    }
    
    // Basic address format validation
    if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
      return {
        valid: false,
        message: 'CONTRACT_ADDRESS is not a valid Ethereum address format'
      };
    }
    
    return {
      valid: true,
      address: contractAddress
    };
  } catch (error) {
    return {
      valid: false,
      message: `Error validating contract address: ${error.message}`
    };
  }
}

/**
 * Create a test donation transaction
 * This simulates a donation without actually making one
 * @returns {Object} Mock transaction result
 */
function createMockTransaction() {
  const txHash = '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  
  return {
    hash: txHash,
    timestamp: Date.now(),
    from: '0x' + Array(40).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    value: '0.01',
    success: true
  };
}

/**
 * Verify if backend services are available
 * @returns {Promise<Object>} Status of backend services
 */
async function checkBackendServices() {
  const services = {
    api: false,
    ipfs: false,
    contract: false
  };
  
  try {
    // Check API
    const apiResponse = await fetch('http://localhost:3000/api/contract-addresses');
    services.api = apiResponse.ok;
    
    if (apiResponse.ok) {
      const contractData = await apiResponse.json();
      services.contract = contractData.success && contractData.data;
    }
    
    // Check IPFS
    const ipfsResponse = await fetch('http://localhost:3000/api/ipfs/status');
    if (ipfsResponse.ok) {
      const ipfsData = await ipfsResponse.json();
      services.ipfs = ipfsData.success && ipfsData.data.available;
    }
  } catch (error) {
    console.error('Error checking backend services:', error);
  }
  
  return {
    allAvailable: Object.values(services).every(s => s),
    services
  };
}

// Browser-specific utility to add testing tools to window
if (typeof window !== 'undefined') {
  window.blockDonateTestUtils = {
    validateContractAddress,
    createMockTransaction,
    checkBackendServices,
    
    // Additional browser-specific helpers
    checkMetaMask: () => {
      return {
        installed: typeof window.ethereum !== 'undefined',
        connected: typeof window.ethereum !== 'undefined' && window.ethereum.selectedAddress
      };
    },
    
    generateTestReport: (results) => {
      const report = {
        timestamp: new Date().toISOString(),
        browser: navigator.userAgent,
        results
      };
      
      // Save to localStorage
      const reportsKey = 'blockDonateTestReports';
      const existingReports = JSON.parse(localStorage.getItem(reportsKey) || '[]');
      existingReports.push(report);
      localStorage.setItem(reportsKey, JSON.stringify(existingReports));
      
      return report;
    }
  };
  
  console.log('Block-Donate Test Utils loaded!');
  console.log('Access utilities with: window.blockDonateTestUtils');
}

// Export for Node.js usage
if (typeof module !== 'undefined') {
  module.exports = {
    validateContractAddress,
    createMockTransaction,
    checkBackendServices
  };
}
