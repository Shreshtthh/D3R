const fs = require('fs');
const path = require('path');

/**
 * Saves contract addresses to a JSON file
 * @param {Object} addresses Object containing contract addresses
 * @param {string} network Optional network name (defaults to "latest")
 */
function saveContractAddresses(addresses, network = 'latest') {
  try {
    const configDir = path.join(__dirname);
    const addressesFile = path.join(configDir, 'addresses.json');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    
    // Read existing addresses or create empty object
    let allAddresses = {};
    if (fs.existsSync(addressesFile)) {
      try {
        allAddresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
      } catch (e) {
        console.log('Error reading existing addresses file, creating new one');
      }
    }
    
    // Add timestamp to the addresses
    addresses.deployedAt = new Date().toISOString();
    
    // Update addresses for this network
    allAddresses[network] = addresses;
    
    // Write back to file
    fs.writeFileSync(
      addressesFile, 
      JSON.stringify(allAddresses, null, 2), 
      'utf8'
    );
    
    console.log(`Contract addresses saved to ${addressesFile}`);
    return true;
  } catch (error) {
    console.error('Failed to save contract addresses:', error);
    return false;
  }
}

/**
 * Loads contract addresses from the JSON file
 * @param {string} network Optional network name (defaults to "latest")
 * @returns {Object} Contract addresses
 */
function getContractAddresses(network = 'latest') {
  try {
    const addressesFile = path.join(__dirname, 'addresses.json');
    if (!fs.existsSync(addressesFile)) {
      return {};
    }
    
    const allAddresses = JSON.parse(fs.readFileSync(addressesFile, 'utf8'));
    return allAddresses[network] || {};
  } catch (error) {
    console.error('Failed to load contract addresses:', error);
    return {};
  }
}

module.exports = {
  saveContractAddresses,
  getContractAddresses
};
