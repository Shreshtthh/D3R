import Web3 from 'web3';

// Initialize Web3 with provider
let web3;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
  // We are in the browser and MetaMask is running
  web3 = new Web3(window.ethereum);
} else {
  // We are on the server OR the user is not running MetaMask
  const provider = new Web3.providers.HttpProvider(
    process.env.NEXT_PUBLIC_RPC_URL || 'http://localhost:8545'
  );
  web3 = new Web3(provider);
}

// Export utility functions for consistent usage
export const toBN = (value) => {
  try {
    return web3.utils.toBN(value);
  } catch (error) {
    console.warn('Error using web3.utils.toBN, falling back to alternative', error);
    if (web3.toBN) {
      return web3.toBN(value);
    } else if (web3.BigNumber) {
      return new web3.BigNumber(value);
    }
    return Number(value);
  }
};

export default web3;
