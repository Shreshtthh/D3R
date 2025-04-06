import { useState, useEffect } from 'react';
import styles from '../styles/Home.module.css';
import { checkWeb3Connection } from '../utils/web3';
import { checkIPFSService } from '../utils/ipfsUpload';

export default function ApiCheck() {
  const [checking, setChecking] = useState(true);
  const [apiStatus, setApiStatus] = useState({
    web3: null,
    ipfs: null,
    contracts: null
  });
  
  useEffect(() => {
    checkAllServices();
  }, []);
  
  const checkAllServices = async () => {
    setChecking(true);
    
    // Check web3 connection
    const web3Status = await checkWeb3Connection();
    
    // Check IPFS service
    const ipfsAvailable = await checkIPFSService();
    
    // Check contract addresses API
    let contractsStatus = null;
    try {
      const response = await fetch('/api/contract-addresses');
      if (response.ok) {
        const data = await response.json();
        contractsStatus = {
          available: true,
          addresses: data.data
        };
      } else {
        contractsStatus = {
          available: false,
          error: "API returned non-200 status"
        };
      }
    } catch (error) {
      contractsStatus = {
        available: false,
        error: error.message
      };
    }
    
    setApiStatus({
      web3: web3Status,
      ipfs: {
        available: ipfsAvailable
      },
      contracts: contractsStatus
    });
    
    setChecking(false);
  };
  
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>API Compatibility Check</h1>
        
        <div className={styles.card} style={{ width: '100%', maxWidth: '800px' }}>
          {checking ? (
            <p>Checking services compatibility...</p>
          ) : (
            <>
              <h2>System Compatibility Status</h2>
              
              <h3>Web3 Connection</h3>
              {apiStatus.web3 ? (
                <div>
                  <p>
                    <strong>Status:</strong> 
                    {apiStatus.web3.connected ? 
                      <span className="connected"> ✅ Connected</span> : 
                      <span className="disconnected"> ❌ Disconnected</span>
                    }
                  </p>
                  {apiStatus.web3.connected && (
                    <>
                      <p><strong>Connected Account:</strong> {apiStatus.web3.account}</p>
                      <p><strong>Network:</strong> {apiStatus.web3.network}</p>
                    </>
                  )}
                </div>
              ) : (
                <p className="disconnected">Unable to check Web3 connection</p>
              )}
              
              <h3>IPFS Service</h3>
              <p>
                <strong>Status:</strong> 
                {apiStatus.ipfs?.available ? 
                  <span className="connected"> ✅ Available</span> : 
                  <span className="disconnected"> ❌ Unavailable</span>
                }
              </p>
              
              <h3>Contract Addresses API</h3>
              {apiStatus.contracts ? (
                <div>
                  <p>
                    <strong>Status:</strong> 
                    {apiStatus.contracts.available ? 
                      <span className="connected"> ✅ Available</span> : 
                      <span className="disconnected"> ❌ Unavailable</span>
                    }
                  </p>
                  {apiStatus.contracts.available && (
                    <div>
                      <p><strong>Contract Addresses:</strong></p>
                      <pre>{JSON.stringify(apiStatus.contracts.addresses, null, 2)}</pre>
                    </div>
                  )}
                  {!apiStatus.contracts.available && apiStatus.contracts.error && (
                    <p><strong>Error:</strong> {apiStatus.contracts.error}</p>
                  )}
                </div>
              ) : (
                <p className="disconnected">Unable to check Contract API</p>
              )}
              
              <button className={styles.button} onClick={checkAllServices}>
                Re-Check Compatibility
              </button>
            </>
          )}
        </div>
        
        <div className={styles.grid} style={{ marginTop: '2rem' }}>
          <div className={styles.card}>
            <h2>Why This Matters</h2>
            <p>Ensuring compatibility between the frontend and backend components is critical for the application to function properly. This check verifies that:</p>
            <ol>
              <li>Your Web3 wallet is properly connected</li>
              <li>The IPFS service for document storage is available</li>
              <li>The contract addresses API is functioning</li>
            </ol>
          </div>
          
          <div className={styles.card}>
            <h2>Troubleshooting</h2>
            <ul>
              <li>If Web3 is disconnected, check your MetaMask connection</li>
              <li>If IPFS is unavailable, ensure the backend server is running</li>
              <li>If Contract Addresses API fails, check server logs</li>
            </ul>
          </div>
        </div>
        
      </main>
    </div>
  );
}
