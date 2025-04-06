import { useState, useEffect } from 'react';
import { getSupportedNetworks, switchNetwork, checkWeb3Connection } from '../utils/web3';
import styles from '../styles/Home.module.css';

export default function NetworkSwitcher({ onNetworkChange }) {
  const [networks, setNetworks] = useState({});
  const [currentNetwork, setCurrentNetwork] = useState(null);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Get supported networks
    const supportedNetworks = getSupportedNetworks();
    setNetworks(supportedNetworks);

    // Check current network
    checkCurrentNetwork();
  }, []);

  const checkCurrentNetwork = async () => {
    try {
      const status = await checkWeb3Connection();
      if (status.connected) {
        setCurrentNetwork(status.network);
      }
    } catch (err) {
      console.error("Error checking network:", err);
    }
  };

  const handleNetworkSwitch = async (networkId) => {
    setError('');
    setSwitching(true);
    try {
      await switchNetwork(parseInt(networkId));
      setCurrentNetwork(parseInt(networkId));
      if (onNetworkChange) onNetworkChange(parseInt(networkId));
    } catch (err) {
      console.error("Failed to switch network:", err);
      setError(err.message);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className={styles.networkSwitcher}>
      <h3>Network</h3>
      <div className={styles.networkOptions}>
        <select
          value={currentNetwork || ''}
          onChange={(e) => handleNetworkSwitch(e.target.value)}
          disabled={switching}
        >
          <option value="">Select Network</option>
          {Object.keys(networks).map((networkId) => (
            <option key={networkId} value={networkId}>
              {networks[networkId].name}
            </option>
          ))}
        </select>
        {switching && <span className={styles.loading}> Switching...</span>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {currentNetwork && (
        <p className={styles.currentNetwork}>
          Current: {networks[currentNetwork]?.name || `Unknown Network (${currentNetwork})`}
        </p>
      )}
    </div>
  );
}
