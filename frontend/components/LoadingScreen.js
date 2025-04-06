import React from 'react';
import styles from '../styles/LoadingScreen.module.css';

export default function LoadingScreen({ message }) {
  return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingContent}>
        <div className={styles.spinner}>
          <div className={styles.cube1}></div>
          <div className={styles.cube2}></div>
        </div>
        <p className={styles.loadingText}>{message || "Loading blockchain data..."}</p>
      </div>
    </div>
  );
}
