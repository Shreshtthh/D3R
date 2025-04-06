import { useState, useEffect } from 'react';
import Head from 'next/head';
import { submitReliefUpdate, getReliefCampaigns, getCurrentAccount } from '../utils/web3';
import styles from '../styles/Home.module.css';

export default function ReliefUpdateSubmission() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');
  const [formData, setFormData] = useState({
    campaignId: '',
    description: '',
    proofIpfsHash: '',
    location: '',
    peopleHelped: 0,
    suppliesDelivered: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  
  useEffect(() => {
    async function loadData() {
      try {
        // Get user's account
        const userAccount = await getCurrentAccount();
        setAccount(userAccount);
        
        // Load campaigns created by this user
        const allCampaigns = await getReliefCampaigns();
        const userCampaigns = allCampaigns.filter(campaign => 
          campaign.creator && campaign.creator.toLowerCase() === userAccount.toLowerCase()
        );
        
        setCampaigns(userCampaigns);
      } catch (error) {
        console.error("Error loading campaigns:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'peopleHelped' ? parseInt(value) || 0 : value
    }));
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setUpdateStatus(null);
    
    try {
      await submitReliefUpdate(
        formData.campaignId,
        formData.description,
        formData.proofIpfsHash,
        formData.location,
        formData.peopleHelped,
        formData.suppliesDelivered
      );
      
      setUpdateStatus({
        success: true,
        message: "Aid update submitted successfully! Your relief progress is now recorded on the blockchain."
      });
      
      // Reset form
      setFormData({
        campaignId: '',
        description: '',
        proofIpfsHash: '',
        location: '',
        peopleHelped: 0,
        suppliesDelivered: '',
      });
    } catch (error) {
      console.error("Relief update submission failed:", error);
      setUpdateStatus({
        success: false,
        message: `Update failed: ${error.message || "Please check your connection and try again"}`
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  if (loading) {
    return (
      <div className={styles.container}>
        <main className={styles.main}>
          <p>Loading your campaigns...</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Submit Relief Progress | Block-Donate</title>
        <meta name="description" content="Report aid deliveries and progress with verified proof" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>Report Relief Progress</h1>
        
        <p className={styles.description}>
          Document your aid deliveries and relief progress with blockchain verification
        </p>
        
        {campaigns.length === 0 ? (
          <div className={styles.noCampaigns}>
            <h2>No Active Relief Campaigns Found</h2>
            <p>
              You don't have any active relief campaigns. 
              Only campaign creators can submit relief updates.
            </p>
            <a href="/donor-dashboard" className={styles.button}>
              View All Campaigns
            </a>
          </div>
        ) : (
          <>
            {updateStatus && (
              <div className={`${styles.statusMessage} ${updateStatus.success ? styles.success : styles.error}`}>
                {updateStatus.message}
              </div>
            )}
            
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="campaignId">Select Relief Campaign:</label>
                <select
                  id="campaignId"
                  name="campaignId"
                  value={formData.campaignId}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                >
                  <option value="">-- Select a campaign --</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.title} - {campaign.parsedMetadata?.disasterType || 'General Relief'}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Update Description:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  required
                  className={styles.formTextarea}
                  placeholder="Describe the relief provided and impact made"
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="location">Specific Location:</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                    placeholder="Specific area where aid was delivered"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="peopleHelped">People Helped:</label>
                  <input
                    type="number"
                    id="peopleHelped"
                    name="peopleHelped"
                    min="0"
                    value={formData.peopleHelped}
                    onChange={handleChange}
                    required
                    className={styles.formInput}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="suppliesDelivered">Supplies Delivered:</label>
                <textarea
                  id="suppliesDelivered"
                  name="suppliesDelivered"
                  value={formData.suppliesDelivered}
                  onChange={handleChange}
                  required
                  className={styles.formTextarea}
                  placeholder="List types and quantities of supplies delivered (e.g., '200 food kits, 500 water bottles')"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="proofIpfsHash">Proof (IPFS Hash):</label>
                <input
                  type="text"
                  id="proofIpfsHash"
                  name="proofIpfsHash"
                  value={formData.proofIpfsHash}
                  onChange={handleChange}
                  required
                  className={styles.formInput}
                  placeholder="IPFS hash of photos/documents proving relief delivery"
                />
                <small>
                  Upload your verification documents/images to IPFS and paste the hash here.
                  <a href="https://nft.storage/" target="_blank" rel="noopener noreferrer" className={styles.inlineLink}>
                    {" "}(Need help uploading to IPFS?)
                  </a>
                </small>
              </div>
              
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.button}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Relief Update'}
                </button>
              </div>
            </form>
          </>
        )}
        
        <div className={styles.verificationNote}>
          <h3>Transparency & Verification</h3>
          <p>
            All relief updates are permanently recorded on the blockchain and linked to 
            verification proof. This creates an immutable, transparent record of your 
            organization's impact that donors can trust.
          </p>
        </div>
      </main>
    </div>
  );
}
