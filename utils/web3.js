// ...existing code...

// Import the web3 instance and toBN function from the helper
import web3, { toBN } from './web3Helper';
import Web3 from 'web3';

// ...existing code...

// Add this helper function before the safeExecute function
function createBN(value) {
  // Check which BN implementation is available
  if (web3.utils && typeof web3.utils.toBN === 'function') {
    return web3.utils.toBN(value);
  } else if (web3.toBN) {
    return web3.toBN(value);
  } else if (web3.BigNumber) {
    return new web3.BigNumber(value);
  } else {
    // Fallback to a simple numeric value if BN is not available
    console.warn('BN functionality not available in web3 instance, using regular number');
    return Number(value);
  }
}

// ...existing code...

// Inside the safeExecute function where the error is occurring
async function safeExecute(callback) {
  try {
    // ...existing code...
    
    // Calculate aggregate statistics
    let totalRaised = toBN('0');  // Fixed: Using the imported toBN instead of web3.utils.toBN
    let totalPeopleHelped = 0;
    let totalCampaigns = campaigns.length;
    
    // ...existing code...
  } catch (error) {
    // ...existing code...
  }
}

// ...existing code...
