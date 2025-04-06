import React from 'react';
import Link from 'next/link';
import styles from '../styles/ConnectionIndicator.module.css';

export default function ConnectionIndicator({ status, isConnected }) {
  // Extract network info if available (from format: "Connected to 0x123... on network (4)")
  let networkInfo = null;
  let accountAddress = null;
  
  if (status.startsWith('Connected to')) {
    const match = status.match(/Connected to (0x[a-fA-F0-9]+) on ([a-z]+) \((\d+)\)/i);
    if (match && match.length >= 4) {
      accountAddress = match[1];
      networkInfo = {
        name: match[2],
        id: match[3]
      };
    }
  }

  // Format address for display
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.substring(0, 8)}...${address.substring(address.length - 6)}`;
  };

  return (
    <div className={`${styles.connectionBanner} ${isConnected ? styles.connected : styles.disconnected}`}>
      <div className={styles.connectionContent}>
        <div className={styles.connectionStatus}>
          <span className={styles.dot}></span>
          <span className={styles.statusText}>
            {isConnected 
              ? `Connected to wallet ${formatAddress(accountAddress)}` 
              : "Wallet not connected"
            }
          </span>
          {networkInfo && (
            <span className={styles.networkBadge}>
              {networkInfo.name} Network
            </span>
          )}
        </div>
        <div className={styles.connectionActions}>
          <Link href="/connection-check" className={styles.checkConnection}>
            Check Connection Status
          </Link>
        </div>
      </div>
    </div>
  );
}
