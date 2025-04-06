import '../styles/globals.css';
import Link from 'next/link';
import { useState } from 'react';
import { DISASTER_TYPES } from '../utils/web3';
import WalletConnection from '../components/WalletConnection';

function MyApp({ Component, pageProps }) {
  const [showDisasterTypes, setShowDisasterTypes] = useState(false);
  
  return (
    <div>
      <nav className="navbar">
        <Link href="/" className="logo">D3R Platform</Link>
        <div className="nav-links">
          <Link href="/" className="nav-link">Home</Link>
          
          <Link href="/donor-dashboard" className="nav-link">Relief Campaigns</Link>
          
          <div className="dropdown">
            <button 
              className="nav-link dropdown-toggle"
              onClick={() => setShowDisasterTypes(!showDisasterTypes)}
            >
              Disaster Types
            </button>
            {showDisasterTypes && (
              <div className="dropdown-menu">
                {Object.entries(DISASTER_TYPES).map(([key, value]) => (
                  <Link 
                    key={key}
                    href={`/donor-dashboard?type=${value}`} 
                    className="dropdown-item"
                  >
                    {value}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link href="/ngo-registration" className="nav-link">NGO Portal</Link>
          <Link href="/milestone-submission" className="nav-link">Relief Progress</Link>
          <Link href="/connection-check" className="nav-link">Wallet Status</Link>
        </div>
        
        {/* Add the wallet connection component */}
        <WalletConnection />
      </nav>
      <Component {...pageProps} />
      <footer className="footer">
        <div className="footer-content">
          <p>D3R Platform - Decentralized Disaster Donation & Relief</p>
          <p>Transparent, tamper-proof, and milestone-based donation management in crisis situations</p>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/how-it-works">How It Works</Link>
            <Link href="/faq">FAQ</Link>
            <Link href="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MyApp;
