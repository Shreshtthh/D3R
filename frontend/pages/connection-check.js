import { useState, useEffect } from 'react';
import Head from 'next/head';
import { initWeb3, getContractAddresses } from '../utils/web3';
import styles from '../styles/Home.module.css';

export default function ConnectionCheck() {
  const [connectionStatus, setConnectionStatus] = useState('Checking connection...');
  const [contractStatus, setContractStatus] = useState({});
  const [projects, setProjects] = useState([]);
  const [error, setError] = useState('');
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    checkConnections();
  }, []);

  async function checkConnections() {
    setIsChecking(true);
    setError('');
    
    try {
      // Initialize web3 and get connection status
      const { web3, accounts } = await initWeb3();
      
      if (!web3) {
        setConnectionStatus('Web3 not initialized. Please install MetaMask or another Web3 provider.');
      } else if (!accounts || accounts.length === 0) {
        setConnectionStatus('Connected to Web3, but no accounts accessible. Please unlock your wallet and grant access.');
      } else {
        setConnectionStatus(`Connected to Web3 with account: ${accounts[0]}`);
        
        // Check network ID
        const networkId = await web3.eth.net.getId();
        const networkType = await web3.eth.net.getNetworkType();
        setConnectionStatus(prevStatus => `${prevStatus} on network ${networkId} (${networkType})`);
        
        // Get contract addresses and check connections
        const addresses = getContractAddresses();
        const statusChecks = {};
        
        for (const [name, address] of Object.entries(addresses)) {
          try {
            // Check if address exists and has code
            if (address) {
              const code = await web3.eth.getCode(address);
              statusChecks[name] = code !== '0x' ? 'Connected' : 'No contract at address';
            } else {
              statusChecks[name] = 'Address not configured';
            }
          } catch (e) {
            console.error(`Error checking ${name} contract:`, e);
            statusChecks[name] = 'Error checking contract';
          }
        }
        
        setContractStatus(statusChecks);
        
        // Try to get project count as a further test
        try {
          if (web3.eth.Contract && addresses.milestoneFunding) {
            const milestoneFundingABI = (await import('../contracts/MilestoneFunding.json')).default.abi;
            const milestoneFunding = new web3.eth.Contract(milestoneFundingABI, addresses.milestoneFunding);
            
            const projectCount = await milestoneFunding.methods.projectCount().call();
            setProjects([{ id: 'count', value: projectCount }]);
          }
        } catch (projectError) {
          console.error("Error fetching projects:", projectError);
        }
      }
    } catch (error) {
      console.error("Connection check error:", error);
      setError(`Error checking connections: ${error.message || 'Unknown error'}`);
      setConnectionStatus('Connection error occurred');
    } finally {
      setIsChecking(false);
    }
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>Connection Check | D3R Platform</title>
        <meta name="description" content="Check your Web3 connection and smart contract status" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Connection Status</h1>
        
        <div className={styles.statusPanel}>
          <h2>Web3 Connection</h2>
          <p className={connectionStatus.includes('Connected') ? styles.connected : styles.disconnected}>
            {connectionStatus}
          </p>
          
          {error && (
            <div className={styles.errorBox}>
              <p>{error}</p>
            </div>
          )}
          
          <button 
            className={styles.retryButton}
            onClick={checkConnections}
            disabled={isChecking}
          >
            {isChecking ? 'Checking...' : 'Check Again'}
          </button>
        </div>
        
        {Object.keys(contractStatus).length > 0 && (
          <div className={styles.contractsPanel}>
            <h2>Smart Contract Status</h2>
            <div className={styles.contractList}>
              {Object.entries(contractStatus).map(([name, status]) => (
                <div key={name} className={styles.contractItem}>
                  <span className={styles.contractName}>{name}</span>
                  <span className={status === 'Connected' ? styles.connected : styles.disconnected}>
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {projects.length > 0 && (
          <div className={styles.projectsPanel}>
            <h2>Project Data Check</h2>
            <div className={styles.projectInfo}>
              <p>
                <strong>Project Count:</strong> {projects.find(p => p.id === 'count')?.value || 'Unknown'}
              </p>
            </div>
          </div>
        )}
        
        <div className={styles.helpSection}>
          <h3>Need Help?</h3>
          <div className={styles.helpTips}>
            <div className={styles.helpTip}>
              <h4>MetaMask Not Connected?</h4>
              <p>
                Make sure you have MetaMask installed and unlocked. 
                Click the MetaMask icon and connect to this site.
              </p>
            </div>
            
            <div className={styles.helpTip}>
              <h4>Wrong Network?</h4>
              <p>
                Ensure you're connected to the Ethereum Sepolia Testnet network.
                You can switch networks in your MetaMask extension.
              </p>
            </div>
            
            <div className={styles.helpTip}>
              <h4>Contract Connection Issues?</h4>
              <p>
                If contracts show as disconnected but your wallet is connected,
                the contract addresses might be incorrect or the contracts might not
                be deployed to the current network.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
