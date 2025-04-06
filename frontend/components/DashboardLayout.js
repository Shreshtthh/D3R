import React from 'react';
import Link from 'next/link';
import { useState } from 'react';
import { DISASTER_TYPES } from '../utils/web3';
import WalletConnection from './WalletConnection';
import SiteFooter from './SiteFooter';
import styles from '../styles/DashboardLayout.module.css';

/**
 * Layout component for consistent page structure across the site
 */
export default function DashboardLayout({ children }) {
  const [showDisasterTypes, setShowDisasterTypes] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  
  return (
    <div className={styles.layoutContainer}>
      <nav className={styles.navbar}>
        <div className={styles.navbarContent}>
          <Link href="/" className={styles.logo}>
            <span className={styles.logoIcon}>D3R</span>
            <span className={styles.logoText}>Platform</span>
          </Link>
          
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            aria-label={showMobileMenu ? "Close menu" : "Open menu"}
          >
            <span className={styles.menuBar}></span>
            <span className={styles.menuBar}></span>
            <span className={styles.menuBar}></span>
          </button>
          
          <div className={`${styles.navLinks} ${showMobileMenu ? styles.mobileActive : ''}`}>
            <Link href="/" className={styles.navLink}>
              Home
            </Link>
            
            <Link href="/donor-dashboard" className={styles.navLink}>
              Relief Campaigns
            </Link>
            
            <div className={styles.dropdown}>
              <button 
                className={styles.navLinkDropdown}
                onClick={() => setShowDisasterTypes(!showDisasterTypes)}
              >
                Disaster Types
                <span className={styles.dropdownArrow}></span>
              </button>
              {showDisasterTypes && (
                <div className={styles.dropdownMenu}>
                  {Object.entries(DISASTER_TYPES).map(([key, value]) => (
                    <Link 
                      key={key}
                      href={`/donor-dashboard?type=${value}`} 
                      className={styles.dropdownItem}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {value}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/ngo-registration" className={styles.navLink}>
              NGO Portal
            </Link>
            
            <Link href="/milestone-submission" className={styles.navLink}>
              Relief Progress
            </Link>
            
            <Link href="/connection-check" className={styles.navLink}>
              Wallet Status
            </Link>
            
            <div className={styles.mobileWalletWrapper}>
              <WalletConnection />
            </div>
          </div>
          
          <div className={styles.desktopWalletWrapper}>
            <WalletConnection />
          </div>
        </div>
      </nav>
      
      <div className={styles.content}>
        {children}
      </div>
      
      <SiteFooter />
    </div>
  );
}
