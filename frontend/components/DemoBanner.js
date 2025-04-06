import React, { useState } from 'react';
import { useDemoMode } from './DemoModeProvider';
import styles from '../styles/DemoBanner.module.css';

export default function DemoBanner() {
  const { toggleDemoMode } = useDemoMode();
  const [minimized, setMinimized] = useState(false);
  
  const handleToggle = (e) => {
    e.preventDefault();
    toggleDemoMode();
  };
  
  if (minimized) {
    return (
      <div className={`${styles.demoBannerMinimized}`} onClick={() => setMinimized(false)}>
        <span>📊</span>
      </div>
    );
  }
  
  return (
    <div className={styles.demoBanner}>
      <div className={styles.demoContent}>
        <div className={styles.demoInfo}>
          <h4>🚀 Demo Mode Active</h4>
          <p>This is a demonstration with simulated blockchain data</p>
        </div>
        <div className={styles.demoActions}>
          <button onClick={handleToggle} className={styles.demoButton}>
            Exit Demo Mode
          </button>
          <button 
            onClick={() => setMinimized(true)} 
            className={styles.minimizeButton}
            aria-label="Minimize demo banner"
          >
            −
          </button>
        </div>
      </div>
    </div>
  );
}
