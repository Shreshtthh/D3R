import { useState, useEffect } from 'react';
import { connectWallet, checkWeb3Connection, checkPreviousConnection } from '../utils/web3';
import styles from '../styles/WalletConnection.module.css';

export default function WalletConnection() {
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  const [isConnecting, setIsConnecting] = useState(false);
  const [account, setAccount] = useState(null);
  const [error, setError] = useState('');
  const [network, setNetwork] = useState(null);
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    // Check for previous connection on component mount
    checkPreviouslyConnectedWallet();
    
    // Define wallet event handlers
    const handleAccountsChanged = (event) => {
      const newAccounts = event.detail;
      if (newAccounts && newAccounts.length > 0) {
        setAccount(newAccounts[0]);
        setConnectionStatus(`Connected`);
        setError('');
      } else {
        setAccount(null);
        setConnectionStatus('Disconnected');
      }
    };
    
    const handleChainChanged = async (event) => {
      setNetwork(event.detail);
      // Refresh connection status
      await checkConnection();
    };
    
    const handleDisconnect = () => {
      setAccount(null);
      setConnectionStatus('Disconnected');
      localStorage.removeItem('walletConnected');
    };
    
    // Add event listeners for wallet events
    window.addEventListener('walletAccountChanged', handleAccountsChanged);
    window.addEventListener('walletChainChanged', handleChainChanged);
    window.addEventListener('walletDisconnected', handleDisconnect);
    
    return () => {
      window.removeEventListener('walletAccountChanged', handleAccountsChanged);
      window.removeEventListener('walletChainChanged', handleChainChanged);
      window.removeEventListener('walletDisconnected', handleDisconnect);
    };
  }, []);
  
  const checkPreviouslyConnectedWallet = async () => {
    try {
      const { connected, address } = await checkPreviousConnection();
      
      if (connected && address) {
        setAccount(address);
        setConnectionStatus(`Connected`);
        checkConnection(); // Get full details
      }
    } catch (err) {
      console.error("Error checking previous wallet connection:", err);
    }
  };
  
  const checkConnection = async () => {
    try {
      const status = await checkWeb3Connection();
      setConnectionStatus(status);
      
      if (status.startsWith('Connected to')) {
        const address = status.split(' ')[2];
        setAccount(address);
        
        // Extract network info
        const networkInfo = status.match(/on ([a-z]+) \((\d+)\)/i);
        if (networkInfo && networkInfo.length >= 3) {
          setNetwork({
            name: networkInfo[1],
            id: networkInfo[2]
          });
        }
      } else {
        setAccount(null);
        setNetwork(null);
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
        setConnectionStatus(`Connected`);
        setNetwork({
          name: result.networkType,
          id: result.networkId
        });
        
        // Add animation class to show successful connection
        document.getElementById('wallet-connection-button')?.classList.add(styles.connectSuccess);
        setTimeout(() => {
          document.getElementById('wallet-connection-button')?.classList.remove(styles.connectSuccess);
        }, 1000);
      } else {
        setError(result.error);
        setConnectionStatus('Connection failed');
        
        // Add animation class to show failed connection
        document.getElementById('wallet-connection-button')?.classList.add(styles.connectFailed);
        setTimeout(() => {
          document.getElementById('wallet-connection-button')?.classList.remove(styles.connectFailed);
        }, 1000);
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
  
  const handleDisconnect = () => {
    setAccount(null);
    setConnectionStatus('Disconnected');
    setNetwork(null);
    localStorage.removeItem('walletConnected');
    setDropdown(false);
  };
  
  const toggleDropdown = () => {
    setDropdown(!dropdown);
  };
  
  const copyAddress = () => {
    if (account) {
      navigator.clipboard.writeText(account);
      const button = document.getElementById('copy-button');
      button.innerText = 'Copied!';
      setTimeout(() => {
        button.innerText = 'Copy';
      }, 2000);
    }
  };
  
  return (
    <div className={styles.walletConnection}>
      {account ? (
        <div className={styles.walletInfo}>
          <button 
            className={styles.connected}
            onClick={toggleDropdown}
            id="wallet-connection-button"
          >
            <span className={styles.dot}></span>
            <span className={styles.address}>{formatAddress(account)}</span>
            <span className={styles.dropdown}></span>
          </button>
          
          {dropdown && (
            <div className={styles.dropdownMenu}>
              <div className={styles.networkInfo}>
                {network && (
                  <span className={network.name === 'private' ? styles.testnet : styles.mainnet}>
                    {network.name} ({network.id})
                  </span>
                )}
              </div>
              <div className={styles.addressFull}>
                {account}
                <button 
                  className={styles.copyButton}
                  onClick={copyAddress}
                  id="copy-button"
                >
                  Copy
                </button>
              </div>
              <hr />
              <button 
                className={styles.disconnectButton}
                onClick={handleDisconnect}
              >
                Disconnect Wallet
              </button>
            </div>
          )}
        </div>
      ) : (
        <button 
          className={styles.connectButton} 
          onClick={handleConnect}
          disabled={isConnecting}
          id="wallet-connection-button"
        >
          {isConnecting ? (
            <span className={styles.connecting}>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
              <span className={styles.loadingDot}></span>
              Connecting
            </span>
          ) : (
            <>Connect Wallet</>
          )}
        </button>
      )}
      
      {error && <div className={styles.error}>{error}</div>}
    </div>
  );
}
