import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
// Import from constants instead of web3
import { DISASTER_TYPES } from '../utils/constants';
import WalletConnection from './WalletConnection';
import SiteFooter from './SiteFooter';
import styles from '../styles/DashboardLayout.module.css';
import DemoBanner from './DemoBanner';
import { useDemoMode } from './DemoModeProvider';
import LoadingScreen from './LoadingScreen';

/**
 * Layout component for consistent page structure across the site
 */
export default function DashboardLayout({ children }) {
  const [showDisasterTypes, setShowDisasterTypes] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const router = useRouter();
  const { demoMode } = useDemoMode();
  
  // Handle page transition loading states
  useEffect(() => {
    const handleStart = (url) => {
      // Set custom loading messages based on the destination page
      if (url.includes('donor-dashboard')) {
        setLoadingMessage("Loading relief campaigns...");
      } else if (url.includes('campaign')) {
        setLoadingMessage("Loading campaign details...");
      } else if (url.includes('ngo')) {
        setLoadingMessage("Loading NGO information...");
      } else if (url.includes('milestone')) {
        setLoadingMessage("Loading milestone data...");
      } else {
        setLoadingMessage("Loading...");
      }
      setPageLoading(true);
    };
    
    const handleComplete = () => {
      setPageLoading(false);
      setShowMobileMenu(false);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleComplete);
    };
  }, [router]);

  // Check if a given path matches the current route
  const isActive = (path) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  };
  
  return (
    <div className={styles.layoutContainer}>
      {pageLoading && <LoadingScreen message={loadingMessage} />}
      
      {demoMode && <DemoBanner />}
      
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
            <span className={`${styles.menuBar} ${showMobileMenu ? styles.menuBarActive : ''}`}></span>
            <span className={`${styles.menuBar} ${showMobileMenu ? styles.menuBarActive : ''}`}></span>
            <span className={`${styles.menuBar} ${showMobileMenu ? styles.menuBarActive : ''}`}></span>
          </button>
          
          <div className={`${styles.navLinks} ${showMobileMenu ? styles.mobileActive : ''}`}>
            <Link href="/" className={`${styles.navLink} ${isActive('/') ? styles.activeLink : ''}`}>
              Home
            </Link>
            
            <Link href="/donor-dashboard" className={`${styles.navLink} ${isActive('/donor-dashboard') ? styles.activeLink : ''}`}>
              Relief Campaigns
            </Link>
            
            <div className={styles.dropdown}>
              <button 
                className={`${styles.navLinkDropdown} ${isActive('/donor-dashboard') ? styles.activeLink : ''}`}
                onClick={() => setShowDisasterTypes(!showDisasterTypes)}
              >
                Disaster Types
                <span className={`${styles.dropdownArrow} ${showDisasterTypes ? styles.dropdownArrowOpen : ''}`}></span>
              </button>
              {showDisasterTypes && (
                <div className={styles.dropdownMenu}>
                  {Object.entries(DISASTER_TYPES).map(([key, value]) => (
                    <Link 
                      key={key}
                      href={`/donor-dashboard?type=${value}`} 
                      className={`${styles.dropdownItem} ${router.query?.type === value ? styles.activeDropdownItem : ''}`}
                      onClick={() => setShowMobileMenu(false)}
                    >
                      {getDisasterTypeIcon(value)} {value}
                    </Link>
                  ))}
                </div>
              )}
            </div>
            
            <Link href="/ngo-registration" className={`${styles.navLink} ${isActive('/ngo-registration') ? styles.activeLink : ''}`}>
              NGO Portal
            </Link>
            
            <Link href="/milestone-submission" className={`${styles.navLink} ${isActive('/milestone-submission') ? styles.activeLink : ''}`}>
              Relief Progress
            </Link>
            
            <Link href="/connection-check" className={`${styles.navLink} ${isActive('/connection-check') ? styles.activeLink : ''}`}>
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

// Helper function to get icons for different disaster types
function getDisasterTypeIcon(type) {
  switch(type) {
    case 'Earthquake': return '🏚️';
    case 'Hurricane': return '🌀';
    case 'Flood': return '🌊';
    case 'Wildfire': return '🔥';
    case 'Drought': return '☀️';
    case 'Tsunami': return '🌊';
    case 'Volcanic Eruption': return '🌋';
    case 'Pandemic': return '🦠';
    default: return '🆘';
  }
}
