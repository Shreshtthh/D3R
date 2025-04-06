import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getReliefCampaigns, DISASTER_TYPES, URGENCY_LEVELS, donate, getDashboardStats, getContractAddresses } from '../utils/web3';
import styles from '../styles/Home.module.css';

export default function DonorDashboard() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    disasterType: '',
    location: '',
    urgency: 0
  });
  const [stats, setStats] = useState({
    totalDonations: "0",
    activeCampaigns: 0,
    peopleHelped: 0,
    verifiedNGOs: 0
  });
  const [error, setError] = useState('');
  const [contractAddresses, setContractAddresses] = useState({});
  const [connectionStatus, setConnectionStatus] = useState('Not connected');
  
  const router = useRouter();
  
  useEffect(() => {
    // Get contract addresses
    setContractAddresses(getContractAddresses());
    
    // If there's a disaster type in the query params, set it in filters
    if (router.query.type) {
      setFilters(prev => ({
        ...prev,
        disasterType: router.query.type
      }));
    }
    
    checkWalletConnection();
    loadCampaigns();
    fetchDashboardStats();
  }, [router.query]);
  
  const checkWalletConnection = async () => {
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          setConnectionStatus(`Connected: ${accounts[0].substring(0, 6)}...${accounts[0].substring(38)}`);
        } else {
          setConnectionStatus('Not connected');
        }
      } else {
        setConnectionStatus('MetaMask not installed');
      }
    } catch (error) {
      console.error("Error checking wallet connection:", error);
      setConnectionStatus('Connection error');
    }
  };
  
  async function fetchDashboardStats() {
    try {
      const stats = await getDashboardStats();
      setStats(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      // Keep the default stats
    }
  }
  
  async function loadCampaigns() {
    setLoading(true);
    setError('');
    try {
      const allCampaigns = await getReliefCampaigns(filters);
      setCampaigns(allCampaigns);
    } catch (error) {
      console.error("Error loading campaigns:", error);
      setError('Failed to load relief campaigns. Please check your wallet connection.');
    } finally {
      setLoading(false);
    }
  }
  
  function handleFilterChange(e) {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  async function handleDonate(campaignId, amount) {
    try {
      await donate(campaignId, amount);
      alert("Thank you for your donation! Your funds will be released based on verified relief milestones.");
      loadCampaigns(); // Refresh campaigns to show updated totals
    } catch (error) {
      console.error("Donation failed:", error);
      alert(`Donation failed. ${error.message || "Please check your wallet and try again."}`);
    }
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Active Relief Campaigns | D3R Platform</title>
        <meta name="description" content="Support verified disaster relief campaigns with blockchain-backed transparency and accountability" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Disaster Relief Campaigns</h1>
        <p className={styles.subtitle}>
          Every donation is tracked on-chain with milestone-based fund releases
        </p>
        
        <div className={styles.connectionStatus}>
          Wallet Status: <span className={connectionStatus.includes('Connected') ? styles.connected : styles.disconnected}>
            {connectionStatus}
          </span>
        </div>
        
        {/* Dashboard Stats */}
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
        
        {/* Filter Panel */}
        <div className={styles.filterPanel}>
          <select 
            name="disasterType" 
            value={filters.disasterType}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            aria-label="Filter by disaster type"
          >
            <option value="">All Disaster Types</option>
            {Object.values(DISASTER_TYPES).map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <input
            type="text"
            name="location"
            placeholder="Filter by location..."
            value={filters.location}
            onChange={handleFilterChange}
            className={styles.filterInput}
            aria-label="Filter by location"
          />
          
          <select
            name="urgency"
            value={filters.urgency}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            aria-label="Filter by urgency level"
          >
            <option value="0">All Urgency Levels</option>
            {Object.entries(URGENCY_LEVELS).map(([label, value]) => (
              <option key={label} value={value}>{label}</option>
            ))}
          </select>
          
          <button onClick={loadCampaigns} className={styles.filterButton}>
            Apply Filters
          </button>
        </div>

        <div className={styles.infoBox}>
          <div className={styles.infoIcon}>ℹ️</div>
          <p>
            D3R uses Chainlink oracles at <strong>{contractAddresses.disasterOracle?.substring(0, 8)}...</strong> to verify disaster occurrence.
            Donations are held in <strong>{contractAddresses.milestoneFunding?.substring(0, 8)}...</strong> until milestones are verified.
          </p>
        </div>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading relief campaigns from blockchain...</p>
          </div>
        ) : error ? (
          <div className={styles.errorBox}>
            <p>{error}</p>
            <button onClick={loadCampaigns} className={styles.retryButton}>Retry</button>
          </div>
        ) : campaigns.length > 0 ? (
          <div className={styles.campaignsGrid}>
            {campaigns.map((campaign) => (
              <div key={campaign.id} className={styles.campaignCard}>
                <div className={styles.campaignHeader}>
                  <div 
                    className={styles.urgencyIndicator}
                    data-urgency={getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}
                  >
                    {getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}
                  </div>
                  <div className={styles.verificationBadge} data-verified={campaign.parsedMetadata?.verified}>
                    {campaign.parsedMetadata?.verified ? 
                      <span title={`Verified by ${campaign.parsedMetadata?.source} with ${campaign.parsedMetadata?.confidence}% confidence`}>
                        ✓ Verified Disaster
                      </span> : 
                      <span>Verification Pending</span>
                    }
                  </div>
                  <h2>{campaign.title}</h2>
                  <div className={styles.ngoName}>by {campaign.ngoName || "Unknown NGO"}</div>
                </div>
                
                <div className={styles.campaignDetails}>
                  <p><strong>Location:</strong> {campaign.parsedMetadata?.location || 'Unknown'}</p>
                  <p><strong>Type:</strong> {campaign.parsedMetadata?.disasterType || 'General Relief'}</p>
                  <p><strong>Deadline:</strong> {formatDeadline(campaign.deadline)}</p>
                </div>
                
                <div className={styles.milestoneProgress}>
                  <p>
                    <strong>Relief Progress:</strong> {campaign.milestonesCompleted} of {campaign.milestoneCount} milestones completed
                  </p>
                  <div className={styles.milestoneBar}>
                    {Array(parseInt(campaign.milestoneCount)).fill().map((_, idx) => (
                      <div 
                        key={idx}
                        className={`${styles.milestone} ${idx < campaign.milestonesCompleted ? styles.completedMilestone : ''}`}
                        title={idx < campaign.milestonesCompleted ? 
                          `Milestone ${idx+1}: Completed and funds released` : 
                          `Milestone ${idx+1}: Pending completion`}
                      ></div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.fundingProgress}>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%`}}
                    ></div>
                  </div>
                  <div className={styles.fundingDetails}>
                    <span>{window.web3 ? window.web3.utils.fromWei(campaign.currentAmount.toString(), 'ether') : (parseInt(campaign.currentAmount)/1e18).toFixed(2)} ETH raised</span>
                    <span>of {window.web3 ? window.web3.utils.fromWei(campaign.targetAmount.toString(), 'ether') : (parseInt(campaign.targetAmount)/1e18).toFixed(2)} ETH goal</span>
                  </div>
                </div>
                
                <div className={styles.campaignActions}>
                  <input
                    type="number"
                    placeholder="Amount in ETH"
                    min="0.01"
                    step="0.01"
                    className={styles.donationInput}
                    aria-label="Donation amount in ETH"
                  />
                  <button 
                    className={styles.donateButton}
                    onClick={(e) => {
                      const amount = e.target.previousSibling.value;
                      if (!amount || isNaN(amount) || amount <= 0) {
                        alert('Please enter a valid donation amount');
                        return;
                      }
                      handleDonate(campaign.id, amount);
                    }}
                    title="Your donation will be safely held in the MilestoneFunding contract and released as relief milestones are verified"
                  >
                    Contribute to Relief
                  </button>
                </div>

                <div className={styles.campaignFooter}>
                  <Link href={`/campaign/${campaign.id}`} className={styles.viewDetailsLink}>
                    View Relief Progress
                  </Link>
                  
                  <a
                    href={`https://etherscan.io/address/${campaign.creator}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.transparencyLink}
                    title="View the NGO's transactions and verification status on the blockchain"
                  >
                    Verify NGO on Blockchain ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noCampaigns}>
            <h2>No active relief campaigns match your filters</h2>
            <p>Try adjusting your filter criteria or check back later for new campaigns.</p>
          </div>
        )}

        {/* How It Works Section - Using actual contract addresses */}
        <section className={styles.howItWorks}>
          <h2>How D3R Works</h2>
          <div className={styles.stepsContainer}>
            <div className={styles.step}>
              <div className={styles.stepNumber}>1</div>
              <h3>Disaster Verification</h3>
              <p>ChainlinkDisasterOracle verifies disaster data from trusted sources</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>2</div>
              <h3>NGO Validation</h3>
              <p>NGOs are verified by NGORegistry before creating relief campaigns</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>3</div>
              <h3>Milestone Creation</h3>
              <p>MilestoneFunding holds donations until relief milestones are achieved</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>4</div>
              <h3>Proof Submission</h3>
              <p>NGOs submit IPFS-stored proofs validated by IPFSVerifier</p>
            </div>
            <div className={styles.step}>
              <div className={styles.stepNumber}>5</div>
              <h3>Fund Release</h3>
              <p>Funds are automatically released when milestones are verified</p>
            </div>
          </div>
        </section>

        <div className={styles.protocolInfo}>
          <h3>D3R Protocol Smart Contracts</h3>
          <div className={styles.contractTable}>
            <div className={styles.contractRow}>
              <span className={styles.contractName}>D3RProtocol</span>
              <span className={styles.contractAddress}>
                <a href={`https://etherscan.io/address/${contractAddresses.d3rProtocol}`} target="_blank" rel="noopener noreferrer">
                  {contractAddresses.d3rProtocol}
                </a>
              </span>
            </div>
            <div className={styles.contractRow}>
              <span className={styles.contractName}>MilestoneFunding</span>
              <span className={styles.contractAddress}>
                <a href={`https://etherscan.io/address/${contractAddresses.milestoneFunding}`} target="_blank" rel="noopener noreferrer">
                  {contractAddresses.milestoneFunding}
                </a>
              </span>
            </div>
            <div className={styles.contractRow}>
              <span className={styles.contractName}>ChainlinkDisasterOracle</span>
              <span className={styles.contractAddress}>
                <a href={`https://etherscan.io/address/${contractAddresses.disasterOracle}`} target="_blank" rel="noopener noreferrer">
                  {contractAddresses.disasterOracle}
                </a>
              </span>
            </div>
            <div className={styles.contractRow}>
              <span className={styles.contractName}>NGORegistry</span>
              <span className={styles.contractAddress}>
                <a href={`https://etherscan.io/address/${contractAddresses.ngoRegistry}`} target="_blank" rel="noopener noreferrer">
                  {contractAddresses.ngoRegistry}
                </a>
              </span>
            </div>
            <div className={styles.contractRow}>
              <span className={styles.contractName}>IPFSVerifier</span>
              <span className={styles.contractAddress}>
                <a href={`https://etherscan.io/address/${contractAddresses.ipfsVerifier}`} target="_blank" rel="noopener noreferrer">
                  {contractAddresses.ipfsVerifier}
                </a>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
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
  let targetValue = 1; // Avoid division by zero
  
  try {
    // Safely use web3 by checking if it exists first
    if (window.web3 && window.web3.utils) {
      currentValue = parseFloat(window.web3.utils.fromWei(current.toString(), 'ether'));
      targetValue = parseFloat(window.web3.utils.fromWei(target.toString(), 'ether'));
    } else {
      // Fallback if web3 is not available
      currentValue = parseFloat(current) / 1e18;
      targetValue = parseFloat(target) / 1e18;
    }
  } catch (error) {
    console.error("Error calculating progress:", error);
    // Use default values
  }
  
  if (isNaN(currentValue) || isNaN(targetValue) || targetValue === 0) {
    return 0;
  }
  
  const progress = (currentValue / targetValue) * 100;
  return Math.min(progress, 100); // Cap at 100%
}
