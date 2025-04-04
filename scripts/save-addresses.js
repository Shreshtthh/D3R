require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { saveContractAddresses } = require('../config/contracts');

// Function to parse log output from Forge deployment
function parseForgeDeploymentLogs(logFilePath) {
  try {
    const logContent = fs.readFileSync(logFilePath, 'utf8');
    
    // Extract addresses using regex patterns
    const ngoRegistryMatch = logContent.match(/NGORegistry deployed at: (0x[a-fA-F0-9]{40})/);
    const fundPoolMatch = logContent.match(/FundPool deployed at: (0x[a-fA-F0-9]{40})/);
    const donationTrackerMatch = logContent.match(/DonationTracker deployed at: (0x[a-fA-F0-9]{40})/);
    const chainlinkOracleMatch = logContent.match(/ChainlinkDisasterOracle deployed at: (0x[a-fA-F0-9]{40})/);
    
    const addresses = {
      ngoRegistry: ngoRegistryMatch ? ngoRegistryMatch[1] : null,
      fundPool: fundPoolMatch ? fundPoolMatch[1] : null,
      donationTracker: donationTrackerMatch ? donationTrackerMatch[1] : null,
      chainlinkOracle: chainlinkOracleMatch ? chainlinkOracleMatch[1] : null
    };
    
    // Filter out null values
    const validAddresses = Object.fromEntries(
      Object.entries(addresses).filter(([_, value]) => value !== null)
    );
    
    if (Object.keys(validAddresses).length === 0) {
      console.error('No contract addresses found in deployment logs');
      return null;
    }
    
    return validAddresses;
  } catch (error) {
    console.error('Error parsing deployment logs:', error);
    return null;
  }
}

// Main function
async function saveAddressesFromLogs() {
  const logFilePath = process.argv[2] || path.join(__dirname, '..', 'forge-deploy-log.txt');
  
  if (!fs.existsSync(logFilePath)) {
    console.error(`Log file not found: ${logFilePath}`);
    console.error('Usage: node save-addresses.js [path-to-forge-log-file]');
    process.exit(1);
  }
  
  const addresses = parseForgeDeploymentLogs(logFilePath);
  
  if (addresses) {
    const saved = saveContractAddresses(addresses);
    
    if (saved) {
      console.log('Addresses successfully saved. Update your .env file with:');
      
      for (const [key, value] of Object.entries(addresses)) {
        // Convert camelCase to UPPER_SNAKE_CASE
        const envKey = key.replace(/([A-Z])/g, '_$1').toUpperCase();
        console.log(`${envKey}_ADDRESS=${value}`);
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  saveAddressesFromLogs();
}
