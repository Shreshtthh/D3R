/**
 * Utility functions for managing wallet connection state
 */

// Save wallet connection state
export const saveWalletConnectionState = (address, chainId) => {
  try {
    localStorage.setItem('walletConnected', 'true');
    localStorage.setItem('walletAddress', address);
    localStorage.setItem('walletChainId', chainId);
    localStorage.setItem('walletConnectedAt', Date.now());
  } catch (e) {
    console.warn('Failed to save wallet state to localStorage:', e);
  }
};

// Clear wallet connection state
export const clearWalletConnectionState = () => {
  try {
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletChainId');
    localStorage.removeItem('walletConnectedAt');
  } catch (e) {
    console.warn('Failed to clear wallet state from localStorage:', e);
  }
};

// Get saved wallet connection state
export const getSavedWalletState = () => {
  try {
    const connected = localStorage.getItem('walletConnected') === 'true';
    const address = localStorage.getItem('walletAddress');
    const chainId = localStorage.getItem('walletChainId');
    const connectedAt = localStorage.getItem('walletConnectedAt');
    
    // Check if connection is recent (within last 24 hours)
    const isRecent = connectedAt && (Date.now() - parseInt(connectedAt)) < 24 * 60 * 60 * 1000;
    
    if (connected && address && isRecent) {
      return {
        connected: true,
        address,
        chainId
      };
    }
    
    return { connected: false };
  } catch (e) {
    console.warn('Failed to get wallet state from localStorage:', e);
    return { connected: false };
  }
};

export default {
  saveWalletConnectionState,
  clearWalletConnectionState,
  getSavedWalletState
};
