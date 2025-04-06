import { useState, useEffect } from 'react';
import { connectWallet, checkWeb3Connection } from '../utils/web3';
import styles from '../styles/WalletConnection.module.css';

export default function WalletConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check connection on initial load
    checkConnection();
    
    // Set up event listeners for wallet changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', checkConnection);
      window.ethereum.on('chainChanged', checkConnection);
      window.ethereum.on('disconnect', () => {
        setAccount(null);
        setConnectionStatus('Disconnected');
      });
    }
    
    // Clean up event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', checkConnection);
        window.ethereum.removeListener('chainChanged', checkConnection);
        window.ethereum.removeListener('disconnect', null);
      }
    };
  }, []);
  
  const checkConnection = async () => {
    try {
      const status = await checkWeb3Connection();
      setConnectionStatus(status);
      
      if (status.startsWith('Connected to')) {
        const address = status.split(' ')[2];
        setAccount(address);
      } else {
        setAccount(null);
      }
      
      setError('');
    } catch (err) {
      console.error("Connection check failed:", err);
      setConnectionStatus('Connection error');
      setAccount(null);
      setError(err.message);
    }
  };
  
  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    
    try {
      const result = await connectWallet();
      
      if (result.success) {
        setAccount(result.address);
        setConnectionStatus(`Connected to ${result.address}`);
      } else {
        setError(result.error);
        setConnectionStatus('Connection failed');
      }
    } catch (err) {
      console.error("Wallet connection failed:", err);
      setError(err.message || "Failed to connect");
      setConnectionStatus('Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Format account address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  return (
    <div className={styles.walletConnection}>
      {account ? (
        <div className={styles.connected}>
          <span className={styles.dot}></span>
          <span className={styles.address}>{formatAddress(account)}</span>
        </div>
      ) : (
        <button 
          className={styles.connectButton} 
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      )}
      
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
