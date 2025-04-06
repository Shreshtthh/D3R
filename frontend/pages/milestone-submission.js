import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { 
  getReliefCampaigns, 
  getMilestones, 
  initWeb3,
  verifyIPFSDocument 
} from '../utils/web3';
import { uploadToIPFS, createDisasterDocumentation } from '../utils/ipfsUpload';
import styles from '../styles/MilestoneSubmission.module.css';

export default function ReliefUpdateSubmission() {
  const [account, setAccount] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [description, setDescription] = useState('');
  const [proofFiles, setProofFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();

  useEffect(() => {
    async function loadData() {
      try {
        // Get user's account - Fix the getCurrentAccount problem
        const { accounts } = await initWeb3(true); // Use initWeb3 directly
        const userAccount = accounts && accounts.length > 0 ? accounts[0] : null;
        setAccount(userAccount);
        
        // Load campaigns created by this user
        if (userAccount) {
          const allCampaigns = await getReliefCampaigns();
          const userCampaigns = allCampaigns.filter(c => 
            c.creator && c.creator.toLowerCase() === userAccount.toLowerCase()
          );
          setCampaigns(userCampaigns);
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setError("Failed to load your campaigns. Please make sure your wallet is connected.");
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);

  // Load milestones when a campaign is selected
  useEffect(() => {
    if (!selectedCampaign) {
      setMilestones([]);
      return;
    }
    
    async function loadMilestones() {
      try {
        const milestonesData = await getMilestones(selectedCampaign.id);
        // Filter out completed milestones
        const pendingMilestones = milestonesData.filter(m => !m.isCompleted);
        setMilestones(pendingMilestones);
        setSelectedMilestone(null);
      } catch (err) {
        console.error("Error loading milestones:", err);
        setError("Failed to load milestones for this campaign.");
      }
    }
    
    loadMilestones();
  }, [selectedCampaign]);

  const handleCampaignChange = (e) => {
    const campaignId = e.target.value;
    const campaign = campaigns.find(c => c.id.toString() === campaignId);
    setSelectedCampaign(campaign);
    setSelectedMilestone(null);
    setError('');
  };

  const handleMilestoneChange = (e) => {
    const milestoneId = e.target.value;
    const milestone = milestones.find(m => m.id.toString() === milestoneId);
    setSelectedMilestone(milestone);
    setError('');
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setProofFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!account) {
      setError("Please connect your wallet to submit a milestone update.");
      return;
    }
    
    if (!selectedCampaign || !selectedMilestone) {
      setError("Please select a campaign and milestone.");
      return;
    }
    
    if (!description.trim()) {
      setError("Please provide a description of the progress made.");
      return;
    }
    
    setIsSubmitting(true);
    setSuccess('');
    setError('');
    
    try {
      // Create documentation package with IPFS uploads
      const documentationData = {
        disasterId: selectedCampaign.parsedMetadata?.disasterId || `campaign-${selectedCampaign.id}`,
        projectId: selectedCampaign.id,
        milestoneId: selectedMilestone.id,
        description: description,
        ngoAddress: account,
        location: selectedCampaign.parsedMetadata?.location || 'Unknown',
        notes: `Milestone update: ${selectedMilestone.description}`
      };
      
      // Upload files and create documentation package
      const uploadResult = await createDisasterDocumentation(documentationData, proofFiles);
      
      if (uploadResult && uploadResult.cid) {
        // Verify the document on-chain
        await verifyIPFSDocument(uploadResult.cid);
        
        // Update UI with success message
        setSuccess(`Successfully submitted milestone update! IPFS CID: ${uploadResult.cid}`);
        
        // Clear form
        setDescription('');
        setProofFiles([]);
        
        // Reload milestones to reflect changes
        const milestonesData = await getMilestones(selectedCampaign.id);
        const pendingMilestones = milestonesData.filter(m => !m.isCompleted);
        setMilestones(pendingMilestones);
        
        // If no more pending milestones, clear selection
        if (pendingMilestones.length === 0) {
          setSelectedMilestone(null);
        }
      } else {
        throw new Error("Failed to upload documentation to IPFS");
      }
    } catch (err) {
      console.error("Error submitting milestone update:", err);
      setError(`Failed to submit milestone update: ${err.message || "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Submit Relief Progress | D3R Platform</title>
        <meta name="description" content="Submit updates on relief milestones" />
      </Head>

      <div className={styles.mainContent}>
        <h1>Submit Relief Progress Report</h1>
        <p className={styles.subtitle}>
          Document and verify the completion of relief milestones for your campaigns
        </p>
        
        {loading ? (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading your campaigns...</p>
          </div>
        ) : !account ? (
          <div className={styles.connectWalletMessage}>
            <p>Please connect your wallet to submit milestone updates.</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className={styles.noCampaigns}>
            <h3>No Campaigns Found</h3>
            <p>You don't have any active relief campaigns associated with this wallet address.</p>
            <p>To create a new relief campaign, please go to the NGO Portal.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.submissionForm}>
            <div className={styles.formGroup}>
              <label htmlFor="campaign">Select Relief Campaign</label>
              <select 
                id="campaign"
                value={selectedCampaign?.id || ''}
                onChange={handleCampaignChange}
                required
              >
                <option value="">-- Select Campaign --</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="milestone">Select Milestone to Update</label>
              <select 
                id="milestone"
                value={selectedMilestone?.id || ''}
                onChange={handleMilestoneChange}
                disabled={!selectedCampaign || milestones.length === 0}
                required
              >
                <option value="">-- Select Milestone --</option>
                {milestones.map(milestone => (
                  <option key={milestone.id} value={milestone.id}>
                    {milestone.description} ({milestone.fundPercentage}% of funds)
                  </option>
                ))}
              </select>
              {selectedCampaign && milestones.length === 0 && (
                <p className={styles.noMilestones}>
                  No pending milestones found for this campaign. All milestones may be completed already.
                </p>
              )}
            </div>
            
            {selectedMilestone && (
              <>
                <div className={styles.milestoneInfo}>
                  <h3>Milestone Details</h3>
                  <p><strong>Description:</strong> {selectedMilestone.description}</p>
                  <p><strong>Verification Type:</strong> {selectedMilestone.verificationType}</p>
                  <p><strong>Fund Percentage:</strong> {selectedMilestone.fundPercentage}% of total funds</p>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="description">Progress Description</label>
                  <textarea 
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={6}
                    placeholder="Describe the progress made and how the milestone requirements have been fulfilled..."
                    required
                  ></textarea>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="files">Upload Evidence Files</label>
                  <p className={styles.fileInfo}>
                    Upload photos, documents, videos, or other evidence files. These will be stored on IPFS.
                  </p>
                  <input 
                    type="file"
                    id="files"
                    onChange={handleFileChange}
                    multiple
                  />
                  {proofFiles.length > 0 && (
                    <div className={styles.selectedFiles}>
                      <p>Selected {proofFiles.length} file(s):</p>
                      <ul>
                        {proofFiles.map((file, index) => (
                          <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
            
            {error && <div className={styles.errorMessage}>{error}</div>}
            {success && <div className={styles.successMessage}>{success}</div>}
            
            <div className={styles.submitActions}>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={isSubmitting || !selectedMilestone}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Relief Update'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
