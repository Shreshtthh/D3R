import { useState, useEffect } from 'react';
import Head from 'next/head';
import { initWeb3, registerNGO, createFundRequest, DISASTER_TYPES } from '../utils/web3';
import styles from '../styles/Home.module.css';

export default function NGORegistration() {
  const [web3Connected, setWeb3Connected] = useState(false);
  const [account, setAccount] = useState('');
  const [activeTab, setActiveTab] = useState('register'); // 'register' or 'fundRequest'
  
  // NGO registration form
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    walletAddress: '',
    disasterExperience: '',
    primaryReliefTypes: [],
    regNumber: '',
    website: '',
    contactPerson: '',
    contactEmail: ''
  });
  
  // Fund request form
  const [fundRequestData, setFundRequestData] = useState({
    title: '',
    description: '',
    targetAmount: '',
    deadline: ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState(null);
  
  useEffect(() => {
    async function loadBlockchainData() {
      const web3Data = await initWeb3();
      if (web3Data) {
        setWeb3Connected(true);
        const accounts = await web3Data.web3.eth.getAccounts();
        setAccount(accounts[0]);
        
        // Pre-fill wallet address with connected account
        setFormData(prev => ({
          ...prev,
          walletAddress: accounts[0]
        }));
      }
    }
    
    loadBlockchainData();
  }, []);
  
  const handleConnect = async () => {
    const web3Data = await initWeb3();
    if (web3Data) {
      setWeb3Connected(true);
      const accounts = await web3Data.web3.eth.getAccounts();
      setAccount(accounts[0]);
      
      // Pre-fill wallet address with connected account
      setFormData(prev => ({
        ...prev,
        walletAddress: accounts[0]
      }));
    }
  };
  
  function handleChange(e) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }
  
  function handleCheckboxChange(reliefType) {
    const currentTypes = [...formData.primaryReliefTypes];
    
    if (currentTypes.includes(reliefType)) {
      // Remove if already selected
      setFormData(prev => ({
        ...prev,
        primaryReliefTypes: prev.primaryReliefTypes.filter(type => type !== reliefType)
      }));
    } else {
      // Add if not selected
      setFormData(prev => ({
        ...prev,
        primaryReliefTypes: [...prev.primaryReliefTypes, reliefType]
      }));
    }
  }
  
  async function handleSubmit(e) {
    e.preventDefault();
    setIsSubmitting(true);
    setRegistrationStatus(null);
    
    try {
      // Include primary relief types and other data in the description
      const enhancedDescription = JSON.stringify({
        description: formData.description,
        disasterExperience: formData.disasterExperience,
        primaryReliefTypes: formData.primaryReliefTypes,
        regNumber: formData.regNumber,
        website: formData.website,
        contactPerson: formData.contactPerson,
        contactEmail: formData.contactEmail
      });
      
      await registerNGO(formData.name, enhancedDescription, formData.walletAddress);
      
      setRegistrationStatus({
        success: true,
        message: "Your relief organization has been successfully registered!"
      });
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        walletAddress: '',
        disasterExperience: '',
        primaryReliefTypes: [],
        regNumber: '',
        website: '',
        contactPerson: '',
        contactEmail: ''
      });
    } catch (error) {
      console.error("NGO registration failed:", error);
      setRegistrationStatus({
        success: false,
        message: `Registration failed: ${error.message || "Please check your connection and try again"}`
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  const handleFundRequest = async (e) => {
    e.preventDefault();
    try {
      // Convert deadline to unix timestamp
      const deadlineDate = new Date(fundRequestData.deadline);
      const deadlineTimestamp = Math.floor(deadlineDate.getTime() / 1000);
      
      await createFundRequest(
        fundRequestData.title,
        fundRequestData.description,
        fundRequestData.targetAmount,
        deadlineTimestamp
      );
      alert('Fund request created successfully!');
      
      // Reset form
      setFundRequestData({
        title: '',
        description: '',
        targetAmount: '',
        deadline: ''
      });
    } catch (error) {
      console.error("Error creating fund request:", error);
      alert('Fund request creation failed. Please try again.');
    }
  };
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Register Your Relief Organization | Block-Donate</title>
        <meta name="description" content="Register your relief organization and request emergency funds" />
      </Head>
      
      <main className={styles.main}>
        <h1 className={styles.title}>NGO Dashboard</h1>
        
        {!web3Connected ? (
          <div>
            <p>Connect your wallet to register as an NGO or request funds</p>
            <button className={styles.button} onClick={handleConnect}>Connect Wallet</button>
          </div>
        ) : (
          <>
            <p className={styles.description}>Connected: {account}</p>
            
            <div className={styles.tabs}>
              <button 
                className={activeTab === 'register' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('register')}
              >
                Register NGO
              </button>
              <button 
                className={activeTab === 'fundRequest' ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab('fundRequest')}
              >
                Create Fund Request
              </button>
            </div>
            
            {activeTab === 'register' && (
              <form className={styles.form} onSubmit={handleSubmit}>
                <h2>Register as an NGO</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="name">Organization Name</label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="description">Mission Statement</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    required
                    placeholder="Describe your organization's mission and relief work"
                  ></textarea>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="walletAddress">Ethereum Wallet Address</label>
                  <input
                    id="walletAddress"
                    type="text"
                    name="walletAddress"
                    value={formData.walletAddress}
                    onChange={handleChange}
                    required
                    placeholder="0x..."
                  />
                  <small>This will be used to receive donations and submit aid updates</small>
                </div>
                
                <div className={styles.formGroup}>
                  <label>Primary Relief Types</label>
                  <div className={styles.checkboxGrid}>
                    {Object.entries(DISASTER_TYPES).map(([key, value]) => (
                      <div key={key} className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id={`relief-${key}`}
                          checked={formData.primaryReliefTypes.includes(value)}
                          onChange={() => handleCheckboxChange(value)}
                        />
                        <label htmlFor={`relief-${key}`}>{value}</label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="disasterExperience">Disaster Response Experience</label>
                  <textarea
                    id="disasterExperience"
                    name="disasterExperience"
                    value={formData.disasterExperience}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Share your organization's experience in disaster relief efforts"
                  ></textarea>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="regNumber">Registration Number</label>
                    <input
                      id="regNumber"
                      type="text"
                      name="regNumber"
                      value={formData.regNumber}
                      onChange={handleChange}
                      placeholder="Official registration ID"
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      type="url"
                      name="website"
                      value={formData.website}
                      onChange={handleChange}
                      placeholder="https://your-organization.org"
                    />
                  </div>
                </div>
                
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="contactPerson">Contact Person</label>
                    <input
                      id="contactPerson"
                      type="text"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="contactEmail">Contact Email</label>
                    <input
                      id="contactEmail"
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                
                <div className={styles.formActions}>
                  <button 
                    type="submit" 
                    className={styles.button}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Registering...' : 'Register NGO'}
                  </button>
                </div>
              </form>
            )}
            
            {activeTab === 'fundRequest' && (
              <form className={styles.form} onSubmit={handleFundRequest}>
                <h2>Create Fund Request</h2>
                
                <div className={styles.formGroup}>
                  <label htmlFor="title">Project Title</label>
                  <input
                    id="title"
                    type="text"
                    value={fundRequestData.title}
                    onChange={(e) => setFundRequestData({...fundRequestData, title: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="projectDescription">Project Description</label>
                  <textarea
                    id="projectDescription"
                    value={fundRequestData.description}
                    onChange={(e) => setFundRequestData({...fundRequestData, description: e.target.value})}
                    rows="4"
                    required
                  ></textarea>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="targetAmount">Target Amount (ETH)</label>
                  <input
                    id="targetAmount"
                    type="number"
                    step="0.01"
                    value={fundRequestData.targetAmount}
                    onChange={(e) => setFundRequestData({...fundRequestData, targetAmount: e.target.value})}
                    required
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="deadline">Deadline</label>
                  <input
                    id="deadline"
                    type="date"
                    value={fundRequestData.deadline}
                    onChange={(e) => setFundRequestData({...fundRequestData, deadline: e.target.value})}
                    required
                  />
                </div>
                
                <button type="submit" className={styles.button}>Create Fund Request</button>
              </form>
            )}
          </>
        )}
        
        <div className={styles.verificationNote}>
          <h3>Verification Process</h3>
          <p>
            After registration, our team will review your organization's information and 
            verify your disaster relief credentials for blockchain transparency and accountability.
            This typically takes 1-3 business days.
          </p>
        </div>
      </main>
    </div>
  );
}
