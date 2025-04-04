require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Default addresses for development/testing
const DEFAULT_ADDRESSES = {
  NGO_REGISTRY_ADDRESS: '0x0000000000000000000000000000000000000000',
  FUND_POOL_ADDRESS: '0x0000000000000000000000000000000000000000',
  DONATION_TRACKER_ADDRESS: '0x0000000000000000000000000000000000000000',
  CHAINLINK_ORACLE_ADDRESS: '0x0000000000000000000000000000000000000000'
};

/**
 * Get contract addresses from environment variables
 * Falls back to addresses.json file if present, then to defaults
 */
function getContractAddresses() {
  // First try to get addresses from environment variables
  const addresses = {
    ngoRegistry: process.env.NGO_REGISTRY_ADDRESS,
    fundPool: process.env.FUND_POOL_ADDRESS,
    donationTracker: process.env.DONATION_TRACKER_ADDRESS,
    chainlinkOracle: process.env.CHAINLINK_ORACLE_ADDRESS
  };

  // Check if any addresses are missing
  const missingAddresses = Object.values(addresses).some(addr => !addr || addr.includes('0x123'));

  if (missingAddresses) {
    console.warn('Some contract addresses not found in environment variables. Checking addresses.json...');
    
    // Try to load from addresses.json if it exists
    const addressesFilePath = path.join(__dirname, '..', 'addresses.json');
    
    if (fs.existsSync(addressesFilePath)) {
      try {
        const savedAddresses = JSON.parse(fs.readFileSync(addressesFilePath, 'utf8'));
        addresses.ngoRegistry = addresses.ngoRegistry || savedAddresses.ngoRegistry;
        addresses.fundPool = addresses.fundPool || savedAddresses.fundPool;
        addresses.donationTracker = addresses.donationTracker || savedAddresses.donationTracker;
        addresses.chainlinkOracle = addresses.chainlinkOracle || savedAddresses.chainlinkOracle;
        console.log('Loaded addresses from addresses.json');
      } catch (error) {
        console.error('Error loading addresses.json:', error);
      }
    } else {
      console.warn('addresses.json not found. Using default addresses for development.');
      // Fall back to defaults
      addresses.ngoRegistry = addresses.ngoRegistry || DEFAULT_ADDRESSES.NGO_REGISTRY_ADDRESS;
      addresses.fundPool = addresses.fundPool || DEFAULT_ADDRESSES.FUND_POOL_ADDRESS;
      addresses.donationTracker = addresses.donationTracker || DEFAULT_ADDRESSES.DONATION_TRACKER_ADDRESS;
      addresses.chainlinkOracle = addresses.chainlinkOracle || DEFAULT_ADDRESSES.CHAINLINK_ORACLE_ADDRESS;
    }
  }

  return addresses;
}

/**
 * Save contract addresses to a JSON file for persistence
 */
function saveContractAddresses(addresses) {
  const addressesFilePath = path.join(__dirname, '..', 'addresses.json');
  
  try {
    fs.writeFileSync(addressesFilePath, JSON.stringify(addresses, null, 2));
    console.log('Contract addresses saved to addresses.json');
    return true;
  } catch (error) {
    console.error('Error saving contract addresses:', error);
    return false;
  }
}

module.exports = {
  getContractAddresses,
  saveContractAddresses
};
