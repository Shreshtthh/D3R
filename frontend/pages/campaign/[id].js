import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { getReliefCampaign, getMilestones, donate, getNGODetails, getVerificationStatus } from '../../utils/web3';
import styles from '../../styles/Campaign.module.css';

export default function CampaignDetails() {
  const router = useRouter();
  const { id } = router.query;
  
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [milestones, setMilestones] = useState([]);
  const [ngoDetails, setNgoDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [verification, setVerification] = useState(null);
  
  useEffect(() => {
    if (!id) return;
    
    async function loadCampaignData() {
      setLoading(true);
      setError('');
      
      try {
        // Get campaign details
        const campaignData = await getReliefCampaign(id);
        setCampaign(campaignData);
        
        // Get NGO details
        if (campaignData.creator) {
          const ngo = await getNGODetails(campaignData.creator);
          setNgoDetails(ngo);
        }
        
        // Get milestones
        const milestoneData = await getMilestones(id);
        setMilestones(milestoneData);
        
        // Get verification details
        if (campaignData.parsedMetadata?.disasterId) {
          const verificationData = await getVerificationStatus(campaignData.parsedMetadata.disasterId);
          setVerification(verificationData);
        }
      } catch (err) {
        console.error("Failed to load campaign:", err);
        setError('Failed to load campaign details. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    loadCampaignData();
  }, [id]);
  
  async function handleDonation(e) {
    e.preventDefault();
    
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }
    
    try {
      await donate(id, donationAmount);
      alert('Thank you for your donation! Your transaction has been submitted.');
      setDonationAmount('');
      
      // Refresh campaign data
      const updatedCampaign = await getReliefCampaign(id);
      setCampaign(updatedCampaign);
    } catch (err) {
      console.error("Donation failed:", err);
      alert(`Donation failed: ${err.message || 'Please check your wallet connection'}`);
    }
  }

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading campaign details...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => router.back()} className={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }
  
  if (!campaign) {
    return (
      <div className={styles.notFoundContainer}>
        <h2>Campaign Not Found</h2>
        <p>The campaign you're looking for does not exist or has been removed.</p>
        <Link href="/donor-dashboard" className={styles.backButton}>
          View All Campaigns
        </Link>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>{campaign.title} | D3R Platform</title>
        <meta name="description" content={`Support the ${campaign.title} relief campaign - ${campaign.description?.substring(0, 100)}...`} />
      </Head>
      
      <div className={styles.breadcrumbs}>
        <Link href="/">Home</Link> &gt; 
        <Link href="/donor-dashboard">Relief Campaigns</Link> &gt; 
        <span>{campaign.title}</span>
      </div>
      
      <div className={styles.campaignHeader}>
        <div className={styles.urgencyBadge} data-urgency={getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}>
          {getUrgencyLabel(campaign.parsedMetadata?.urgencyLevel)}
        </div>
        <h1>{campaign.title}</h1>
        <p className={styles.campaignLocation}>
          {campaign.parsedMetadata?.location || 'Unknown Location'}
        </p>
        
        {verification && (
          <div className={styles.verificationInfo}>
            <div className={styles.verificationBadge} data-verified={verification.verified}>
              {verification.verified ? '✓ Verified Disaster' : 'Verification Pending'}
            </div>
            {verification.verified && (
              <div className={styles.verificationDetails}>
                <p>Verified by: {verification.source}</p>
                <p>Confidence: {verification.confidence}%</p>
                <p>Verified on: {new Date(verification.timestamp * 1000).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className={styles.campaignContent}>
        <div className={styles.mainContent}>
          <div className={styles.tabs}>
            <button 
              className={activeTab === 'details' ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab('details')}
            >
              Campaign Details
            </button>
            <button 
              className={activeTab === 'milestones' ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab('milestones')}
            >
              Relief Milestones
            </button>
            <button 
              className={activeTab === 'ngo' ? styles.activeTab : styles.tab}
              onClick={() => setActiveTab('ngo')}
            >
              NGO Information
            </button>
          </div>
          
          {activeTab === 'details' && (
            <div className={styles.tabContent}>
              <p className={styles.campaignDescription}>{campaign.description}</p>
              
              {campaign.parsedMetadata?.disasterType && (
                <div className={styles.metadataSection}>
                  <h3>Disaster Type</h3>
                  <p>{campaign.parsedMetadata.disasterType}</p>
                </div>
              )}
              
              <div className={styles.metadataSection}>
                <h3>Timeline</h3>
                <p><strong>Deadline:</strong> {formatDeadline(campaign.deadline)}</p>
              </div>
              
              <div className={styles.blockchainInfo}>
                <h3>Blockchain Information</h3>
                <p>All donations and fund releases for this campaign are tracked on the Ethereum blockchain for full transparency.</p>
                <div className={styles.addressInfo}>
                  <div>
                    <span className={styles.addressLabel}>Campaign Contract:</span>
                    <a 
                      href={`https://etherscan.io/address/${campaign.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.addressLink}
                    >
                      {shortenAddress(campaign.id)}
                    </a>
                  </div>
                  <div>
                    <span className={styles.addressLabel}>NGO Address:</span>
                    <a 
                      href={`https://etherscan.io/address/${campaign.creator}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={styles.addressLink}
                    >
                      {shortenAddress(campaign.creator)}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'milestones' && (
            <div className={styles.tabContent}>
              <h3>Relief Progress Milestones</h3>
              {milestones.length > 0 ? (
                <div className={styles.milestonesList}>
                  {milestones.map((milestone, index) => (
                    <div 
                      key={index} 
                      className={`${styles.milestone} ${milestone.isCompleted ? styles.completedMilestone : ''}`}
                    >
                      <div className={styles.milestoneHeader}>
                        <div className={styles.milestoneStatus}>
                          {milestone.isCompleted ? (
                            <span className={styles.completedStatus}>✓ Completed</span>
                          ) : (
                            <span className={styles.pendingStatus}>Pending</span>
                          )}
                        </div>
                        <div className={styles.milestoneFunding}>
                          {milestone.fundPercentage}% of funds
                        </div>
                      </div>
                      <h4>{milestone.description}</h4>
                      
                      <div className={styles.milestoneDetails}>
                        <p>Verification Method: {milestone.verificationType}</p>
                        
                        {milestone.isCompleted && milestone.proofCID && (
                          <div className={styles.milestoneProof}>
                            <p>Verified on: {new Date(milestone.verificationTimestamp * 1000).toLocaleDateString()}</p>
                            <a 
                              href={`https://ipfs.io/ipfs/${milestone.proofCID}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.proofLink}
                            >
                              View Proof Documentation
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p>No milestones have been set for this campaign yet.</p>
              )}
            </div>
          )}
          
          {activeTab === 'ngo' && (
            <div className={styles.tabContent}>
              {ngoDetails ? (
                <div className={styles.ngoInfo}>
                  <h3>{ngoDetails.name}</h3>
                  
                  <div className={styles.ngoVerification}>
                    {ngoDetails.verified ? (
                      <span className={styles.verifiedBadge}>✓ Verified Organization</span>
                    ) : (
                      <span className={styles.unverifiedBadge}>⚠ Unverified</span>
                    )}
                  </div>
                  
                  <div className={styles.ngoDetails}>
                    {ngoDetails.website && (
                      <p>
                        <strong>Website:</strong>{' '}
                        <a 
                          href={ngoDetails.website.startsWith('http') ? ngoDetails.website : `https://${ngoDetails.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {ngoDetails.website}
                        </a>
                      </p>
                    )}
                    
                    {ngoDetails.contact && (
                      <p><strong>Contact:</strong> {ngoDetails.contact}</p>
                    )}
                  </div>
                  
                  <div className={styles.ngoWarning}>
                    <p>
                      Always verify the NGO's credentials independently before making large donations.
                      D3R verifies organizations, but due diligence is still recommended.
                    </p>
                  </div>
                </div>
              ) : (
                <p>NGO information is not available.</p>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.sidePanel}>
          <div className={styles.fundingPanel}>
            <div className={styles.fundingProgress}>
              <h3>Funding Progress</h3>
              <div className={styles.progressBar}>
                <div 
                  className={styles.progressFill}
                  style={{width: `${calculateProgress(campaign.currentAmount, campaign.targetAmount)}%`}}
                ></div>
              </div>
              <div className={styles.fundingStats}>
                <div className={styles.raisedAmount}>
                  <span className={styles.raisedValue}>
                    {formatEthAmount(campaign.currentAmount)}
                  </span>
                  <span className={styles.raisedLabel}>
                    raised of {formatEthAmount(campaign.targetAmount)} ETH
                  </span>
                </div>
                <div className={styles.percentFunded}>
                  {calculateProgress(campaign.currentAmount, campaign.targetAmount)}%
                </div>
              </div>
              
              <div className={styles.milestoneProgress}>
                <span className={styles.milestoneLabel}>
                  {campaign.milestonesCompleted} of {campaign.milestoneCount} milestones completed
                </span>
                <div className={styles.milestoneBar}>
                  {Array(parseInt(campaign.milestoneCount)).fill().map((_, idx) => (
                    <div
                      key={idx}
                      className={`${styles.milestoneMarker} ${idx < campaign.milestonesCompleted ? styles.completedMarker : ''}`}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            
            <form className={styles.donateForm} onSubmit={handleDonation}>
              <h3>Support This Campaign</h3>
              <p className={styles.donationInfo}>
                Your donation will be held in a smart contract and released only when 
                verified relief milestones are completed.
              </p>
              
              <div className={styles.donationInput}>
                <input 
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="Amount in ETH"
                  value={donationAmount}
                  onChange={e => setDonationAmount(e.target.value)}
                  required
                />
                <span className={styles.ethLabel}>ETH</span>
              </div>
              
              <button type="submit" className={styles.donateButton}>
                Contribute to Relief
              </button>
            </form>
            
            <div className={styles.shareSection}>
              <h4>Share Campaign</h4>
              <div className={styles.shareButtons}>
                <button 
                  className={styles.shareButton}
                  onClick={() => window.open(`https://twitter.com/intent/tweet?text=Support the ${encodeURIComponent(campaign.title)} disaster relief campaign on D3R&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                  aria-label="Share on Twitter"
                >
                  Twitter
                </button>
                <button 
                  className={styles.shareButton}
                  onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank')}
                  aria-label="Share on Facebook"
                >
                  Facebook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
    return `${diffDays} days remaining`;
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

function formatEthAmount(amount) {
  if (!amount) return '0';
  
  try {
    if (window.web3 && window.web3.utils) {
      return window.web3.utils.fromWei(amount.toString(), 'ether');
    } else {
      return (parseFloat(amount) / 1e18).toFixed(4);
    }
  } catch (error) {
    console.error("Error formatting ETH amount:", error);
    return '0';
  }
}

function shortenAddress(address) {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}
