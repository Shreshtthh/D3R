import React from 'react';
import Link from 'next/link';
import styles from '../styles/SiteFooter.module.css';

export default function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.footerMain}>
          <div className={styles.footerColumn}>
            <h3>D3R Platform</h3>
            <p>Decentralized Disaster Donation & Relief</p>
            <p>Transparent, tamper-proof, and milestone-based donation management in crisis situations</p>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Site Map</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/">Home</Link></li>
              <li><Link href="/donor-dashboard">Relief Campaigns</Link></li>
              <li><Link href="/ngo-registration">NGO Portal</Link></li>
              <li><Link href="/milestone-submission">Relief Progress</Link></li>
              <li><Link href="/connection-check">Wallet Status</Link></li>
            </ul>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Resources</h3>
            <ul className={styles.footerLinks}>
              <li><Link href="/about">About</Link></li>
              <li><Link href="/how-it-works">How It Works</Link></li>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/contact">Contact</Link></li>
            </ul>
          </div>
          
          <div className={styles.footerColumn}>
            <h3>Smart Contracts</h3>
            <ul className={styles.footerLinks}>
              <li><a href="https://etherscan.io/address/0xB0C04bF81c2D64cC5Ae4CCeaFe6906D391476304" target="_blank" rel="noopener noreferrer">D3R Protocol</a></li>
              <li><a href="https://etherscan.io/address/0xD09c0b1677107e25B78271dA70295580Bf8BEA52" target="_blank" rel="noopener noreferrer">Milestone Funding</a></li>
              <li><a href="https://etherscan.io/address/0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01" target="_blank" rel="noopener noreferrer">NGO Registry</a></li>
            </ul>
          </div>
        </div>
        
        <div className={styles.footerBottom}>
          <p className={styles.copyright}>© {new Date().getFullYear()} D3R Platform. All rights reserved.</p>
          <div className={styles.footerLegal}>
            <Link href="/terms">Terms of Service</Link>
            <Link href="/privacy">Privacy Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
