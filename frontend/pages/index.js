import Head from 'next/head';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import styles from '../styles/Home.module.css';
import { getDashboardStats, getReliefCampaigns, checkWeb3Connection } from '../utils/web3';
import Image from 'next/image';
import DashboardLayout from '../components/DashboardLayout';
import ConnectionIndicator from '../components/ConnectionIndicator';

export default function Home() {
  const [stats, setStats] = useState({
    totalDonations: "0",
    activeCampaigns: 0,
    peopleHelped: 0,
    verifiedNGOs: 0
  });
  const [featuredCampaigns, setFeaturedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('Checking...');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        // Check web3 connection status
        const status = await checkWeb3Connection();
        setConnectionStatus(status);
        setIsConnected(status.startsWith('Connected to'));
        
        const stats = await getDashboardStats();
        setStats(stats);
        
        // Get 3 featured campaigns
        const campaigns = await getReliefCampaigns();
        setFeaturedCampaigns(campaigns.slice(0, 3));
      } catch (error) {
        console.error("Failed to load data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();

    // Set up event listeners to refresh data when wallet status changes
    window.addEventListener('walletAccountChanged', loadData);
    window.addEventListener('walletChainChanged', loadData);
    
    return () => {
      window.removeEventListener('walletAccountChanged', loadData);
      window.removeEventListener('walletChainChanged', loadData);
    };
  }, []);

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <Head>
          <title>D3R Platform - Decentralized Disaster Donation & Relief</title>
          <meta name="description" content="Blockchain-based platform for transparent and accountable disaster relief donations with milestone-based fund releases" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          {/* Connection status bar at top */}
          <ConnectionIndicator status={connectionStatus} isConnected={isConnected} />

          <div className={styles.heroBanner}>
            <div className={styles.heroContent}>
              <h1>Transparent Disaster Relief on the Blockchain</h1>
              <p>D3R is transforming disaster donations with verified milestones, 
              transparent fund distribution, and immutable on-chain records.</p>
              <div className={styles.heroButtons}>
                <Link href="/donor-dashboard" className={styles.primaryButton}>
                  Support Relief Campaigns
                </Link>
                <Link href="/how-it-works" className={styles.secondaryButton}>
                  Learn How It Works
                </Link>
              </div>
            </div>
            <div className={styles.heroImage}>
              <div style={{ position: 'relative', width: '100%', height: '200px' }}>
                <Image 
                  src="/images/relief-hero.svg"
                  alt="Disaster Relief Illustration"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDQwMCAyMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IiNmMGYwZjAiLz48dGV4dCB4PSIyMDAiIHk9IjEwMCIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMjAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2NjYiPkQzUiBSZWxpZWYgUGxhdGZvcm08L3RleHQ+PC9zdmc+'
                  }}
                />
              </div>
            </div>
          </div>

          <section className={styles.impactSection}>
            <h2>Our Impact So Far</h2>
            <div className={styles.statsPanel}>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{stats.totalDonations} ETH</span>
                <span className={styles.statLabel}>Donated</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{stats.activeCampaigns}</span>
                <span className={styles.statLabel}>Active Campaigns</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{stats.peopleHelped.toLocaleString()}</span>
                <span className={styles.statLabel}>People Helped</span>
              </div>
              <div className={styles.statBlock}>
                <span className={styles.statValue}>{stats.verifiedNGOs}</span>
                <span className={styles.statLabel}>Verified NGOs</span>
              </div>
            </div>
          </section>

          <section className={styles.navigationCards}>
            <h2>Relief Platform Features</h2>
            <div className={styles.cardGrid}>
              <Link href="/donor-dashboard" className={`${styles.navCard} ${styles.donorCard}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>💰</div>
                  <h3>Donor Dashboard</h3>
                  <p>Browse verified disaster relief campaigns and make transparent donations</p>
                </div>
                <div className={styles.cardArrow}>→</div>
              </Link>
              
              <Link href="/ngo-registration" className={`${styles.navCard} ${styles.ngoCard}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>🏥</div>
                  <h3>NGO Portal</h3>
                  <p>Register your relief organization and manage campaigns</p>
                </div>
                <div className={styles.cardArrow}>→</div>
              </Link>
              
              <Link href="/milestone-submission" className={`${styles.navCard} ${styles.milestoneCard}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>📋</div>
                  <h3>Relief Progress</h3>
                  <p>Submit and track relief milestones with blockchain verification</p>
                </div>
                <div className={styles.cardArrow}>→</div>
              </Link>
              
              <Link href="/connection-check" className={`${styles.navCard} ${styles.checkCard}`}>
                <div className={styles.cardContent}>
                  <div className={styles.cardIcon}>🔄</div>
                  <h3>Connection Status</h3>
                  <p>Check your wallet connection and smart contract status</p>
                </div>
                <div className={styles.cardArrow}>→</div>
              </Link>
            </div>
          </section>

          <section className={styles.howItWorks}>
            <h2>Transparency Through Blockchain Technology</h2>
            <div className={styles.stepsContainer}>
              <div className={styles.step}>
                <div className={styles.stepNumber}>1</div>
                <h3>Oracle-Verified Disasters</h3>
                <p>Our Chainlink oracles verify disaster data from trusted sources</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>2</div>
                <h3>NGO Verification</h3>
                <p>Every relief organization is thoroughly vetted before acceptance</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>3</div>
                <h3>Milestone-Based Funding</h3>
                <p>Funds are released incrementally as relief milestones are achieved</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>4</div>
                <h3>IPFS-Stored Evidence</h3>
                <p>Relief documentation is stored permanently in a decentralized way</p>
              </div>
              <div className={styles.step}>
                <div className={styles.stepNumber}>5</div>
                <h3>Immutable Records</h3>
                <p>All transactions are recorded on-chain for permanent transparency</p>
              </div>
            </div>
          </section>

          <section className={styles.featuredCampaigns}>
            <h2>Featured Relief Campaigns</h2>
            {loading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading campaigns...</p>
              </div>
            ) : featuredCampaigns.length > 0 ? (
              <div className={styles.campaignsPreview}>
                {featuredCampaigns.map(campaign => (
                  <div key={campaign.id} className={styles.campaignPreviewCard}>
                    <div 
                      className={styles.urgencyIndicator}
                      data-urgency={getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}
                    >
                      {getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}
                    </div>
                    <h3>{campaign.title}</h3>
                    <p className={styles.campaignLocation}>{campaign.parsedMetadata?.location}</p>
                    <div className={styles.progressBarSmall}>
                      <div 
                        className={styles.progressFill}
                        style={{width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%`}}
                      ></div>
                    </div>
                    <div className={styles.campaignStats}>
                      <span>{calculateProgress(campaign.currentAmount, campaign.targetAmount)}% funded</span>
                      <span>{formatDeadline(campaign.deadline)}</span>
                    </div>
                    <Link href={`/campaign/${campaign.id}`} className={styles.viewCampaignButton}>
                      View Campaign
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className={styles.noCampaigns}>No active campaigns found</p>
            )}
            <div className={styles.viewAllContainer}>
              <Link href="/donor-dashboard" className={styles.viewAllButton}>
                View All Active Campaigns
              </Link>
            </div>
          </section>

          <section className={styles.trustSection}>
            <h2>Why Trust D3R Platform</h2>
            <div className={styles.trustPoints}>
              <div className={styles.trustPoint}>
                <div className={styles.trustIcon}>🔒</div>
                <h3>Secure Smart Contracts</h3>
                <p>Our code is audited and open source for maximum security</p>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustIcon}>✓</div>
                <h3>Verified NGOs</h3>
                <p>Every organization is vetted before being allowed on the platform</p>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustIcon}>🔗</div>
                <h3>Oracle-Backed Data</h3>
                <p>Chainlink oracles provide verified, tamper-proof information</p>
              </div>
              <div className={styles.trustPoint}>
                <div className={styles.trustIcon}>📊</div>
                <h3>Full Transparency</h3>
                <p>Track every donation and milestone on the blockchain</p>
              </div>
            </div>
          </section>

          <section className={styles.joinSection}>
            <div className={styles.joinBox}>
              <h2>Are you an NGO working in disaster relief?</h2>
              <p>Join the D3R platform to receive secure funding and showcase your transparency</p>
              <Link href="/ngo-registration" className={styles.primaryButton}>
                Register Your Organization
              </Link>
            </div>
          </section>
        </main>
      </div>
    </DashboardLayout>
  );
}

// Helper functions
function getUrgencyLabel(level) {
  switch(level) {
    case 5: return 'CRITICAL';
    case 4: return 'HIGH';
    case 3: return 'MEDIUM';
    case 2: return 'LOW';
    case 1: return 'RECOVERY';
    default: return 'UNKNOWN';
  }
}

function formatDeadline(timestamp) {
  if (!timestamp) return 'Unknown';
  
  const deadline = new Date(timestamp * 1000);
  const now = new Date();
  const diffTime = deadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return 'Expired';
  } else if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Tomorrow';
  } else {
    return `${diffDays} days left`;
  }
}

function calculateProgress(current, target) {
  let currentValue = 0;
  let targetValue = 1; 
  
  try {
    if (window.web3 && window.web3.utils) {
      currentValue = parseFloat(window.web3.utils.fromWei(current.toString(), 'ether'));
      targetValue = parseFloat(window.web3.utils.fromWei(target.toString(), 'ether'));
    } else {
      currentValue = parseFloat(current) / 1e18;
      targetValue = parseFloat(target) / 1e18;
    }
  } catch (error) {
    console.error("Error calculating progress:", error);
  }
  
  if (isNaN(currentValue) || isNaN(targetValue) || targetValue === 0) {
    return 0;
  }
  
  return Math.min(Math.round((currentValue / targetValue) * 100), 100);
}
