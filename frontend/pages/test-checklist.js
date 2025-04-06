import { useState, useEffect } from 'react';
import { checkWeb3Connection } from '../utils/web3';
import { checkIPFSService } from '../utils/ipfsUpload';
import styles from '../styles/Home.module.css';

export default function TestChecklist() {
  const [checklistItems, setChecklistItems] = useState([
    { id: 'web3', title: 'Web3 Connection', status: 'pending', details: null },
    { id: 'ipfs', title: 'IPFS Service', status: 'pending', details: null },
    { id: 'metamask', title: 'MetaMask Installed', status: 'pending', details: null },
    { id: 'account', title: 'Account Connected', status: 'pending', details: null },
    { id: 'contract', title: 'Contract Available', status: 'pending', details: null },
    { id: 'backend', title: 'Backend API', status: 'pending', details: null },
    { id: 'forms', title: 'Forms Working', status: 'manual', details: null },
    { id: 'donations', title: 'Donations Working', status: 'manual', details: null },
    { id: 'milestones', title: 'Milestones Working', status: 'manual', details: null },
    { id: 'ngo', title: 'NGO Registration', status: 'manual', details: null },
  ]);

  // Run automated checks on component mount
  useEffect(() => {
    runAutomatedTests();
  }, []);
  
  const runAutomatedTests = async () => {
    // Reset all automated test statuses
    setChecklistItems(prevItems =>
      prevItems.map(item => 
        item.status !== 'manual' 
          ? { ...item, status: 'pending', details: null } 
          : item
      )
    );
    
    // Test Web3 Connection
    try {
      const web3Status = await checkWeb3Connection();
      updateItemStatus('web3', 
        web3Status.connected ? 'success' : 'failure', 
        web3Status.connected ? 
          `Connected to network ${web3Status.network}` : 
          `Failed: ${web3Status.message}`
      );
      
      // If Web3 is connected, update MetaMask and Account checks
      updateItemStatus('metamask', 'success', 'MetaMask is available');
      updateItemStatus('account', 
        web3Status.connected ? 'success' : 'failure', 
        web3Status.connected ? 
          `Account: ${web3Status.account.slice(0, 6)}...${web3Status.account.slice(-4)}` : 
          'No account connected'
      );
      
      // Check if contract is connected
      updateItemStatus('contract', 
        web3Status.contractConnected ? 'success' : 'failure',
        web3Status.contractConnected ? 
          'Smart contract is available' : 
          'Smart contract not connected'
      );
    } catch (error) {
      updateItemStatus('web3', 'failure', `Error: ${error.message}`);
      updateItemStatus('metamask', 'failure', 'Could not detect MetaMask');
      updateItemStatus('account', 'failure', 'No account access');
      updateItemStatus('contract', 'failure', 'Contract not available');
    }
    
    // Test IPFS Service
    try {
      const ipfsAvailable = await checkIPFSService();
      updateItemStatus('ipfs', 
        ipfsAvailable ? 'success' : 'failure', 
        ipfsAvailable ? 'IPFS service is available' : 'IPFS service is unavailable'
      );
    } catch (error) {
      updateItemStatus('ipfs', 'failure', `Error: ${error.message}`);
    }
    
    // Test Backend API
    try {
      const response = await fetch('/api/contract-addresses');
      if (response.ok) {
        updateItemStatus('backend', 'success', 'Backend API is available');
      } else {
        const errorData = await response.json();
        updateItemStatus('backend', 'failure', 
          `Backend returned error ${response.status}: ${errorData.message || 'Unknown error'}`
        );
      }
    } catch (error) {
      updateItemStatus('backend', 'failure', `Error: ${error.message}`);
    }
  };
  
  const updateItemStatus = (id, status, details) => {
    setChecklistItems(prevItems =>
      prevItems.map(item => 
        item.id === id ? { ...item, status, details } : item
      )
    );
  };
  
  const toggleManualCheck = (id) => {
    setChecklistItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id && item.status === 'manual') {
          const newStatus = item.manualStatus === 'success' ? 'failure' : 'success';
          return { 
            ...item, 
            manualStatus: newStatus,
            details: newStatus === 'success' ? 'Marked as working' : 'Marked as not working'
          };
        }
        return item;
      })
    );
  };
  
  const generateTestReport = () => {
    const successes = checklistItems.filter(item => 
      item.status === 'success' || item.manualStatus === 'success'
    ).length;
    
    const total = checklistItems.length;
    const percentage = Math.round((successes / total) * 100);
    
    let overallStatus;
    if (percentage === 100) overallStatus = 'Fully Functional';
    else if (percentage >= 80) overallStatus = 'Mostly Working';
    else if (percentage >= 50) overallStatus = 'Partially Working';
    else overallStatus = 'Major Issues';
    
    const report = {
      date: new Date().toLocaleString(),
      overallStatus,
      percentage,
      items: checklistItems.map(item => ({
        title: item.title,
        status: item.status === 'manual' ? item.manualStatus || 'not tested' : item.status,
        details: item.details
      }))
    };
    
    // Save report to localStorage
    const reports = JSON.parse(localStorage.getItem('dappTestReports') || '[]');
    reports.push(report);
    localStorage.setItem('dappTestReports', JSON.stringify(reports));
    
    alert(`Test Report Generated!\nDApp Status: ${overallStatus} (${percentage}%)\nSaved to browser storage.`);
  };
  
  const getStatusIcon = (status, manualStatus) => {
    if (status === 'manual') {
      if (!manualStatus) return '❓';
      return manualStatus === 'success' ? '✅' : '❌';
    }
    
    switch (status) {
      case 'success': return '✅';
      case 'failure': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };
  
  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <h1 className={styles.title}>DApp Testing Checklist</h1>
        
        <div className={styles.description}>
          <p>Use this checklist to verify all components of your DApp are working correctly.</p>
        </div>
        
        <div className={styles.card} style={{ width: '100%', maxWidth: '800px' }}>
          <h2>System Components</h2>
          
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eaeaea' }}>Component</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eaeaea' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px', borderBottom: '1px solid #eaeaea' }}>Details</th>
                <th style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eaeaea' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {checklistItems.map(item => (
                <tr key={item.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eaeaea' }}>{item.title}</td>
                  <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eaeaea' }}>
                    {getStatusIcon(item.status, item.manualStatus)}
                  </td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #eaeaea' }}>
                    {item.details || 'No details available'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #eaeaea' }}>
                    {item.status === 'manual' ? (
                      <button 
                        className={styles.button}
                        style={{ 
                          padding: '4px 8px', 
                          fontSize: '0.8rem',
                          backgroundColor: item.manualStatus === 'success' ? 'green' : '#0070f3'
                        }}
                        onClick={() => toggleManualCheck(item.id)}
                      >
                        {item.manualStatus === 'success' ? 'Works ✓' : 'Mark as Working'}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between' }}>
            <button className={styles.button} onClick={runAutomatedTests}>
              Run Automated Tests
            </button>
            <button 
              className={styles.button} 
              style={{ backgroundColor: '#28a745' }}
              onClick={generateTestReport}
            >
              Generate Test Report
            </button>
          </div>
        </div>
        
        <div className={styles.grid} style={{ marginTop: '2rem' }}>
          <div className={styles.card}>
            <h2>Testing Instructions</h2>
            <p>For automated tests:</p>
            <ul>
              <li>Make sure your MetaMask wallet is unlocked</li>
              <li>Ensure your backend server is running</li>
              <li>Click "Run Automated Tests" to check connectivity</li>
            </ul>
            
            <p>For manual tests:</p>
            <ul>
              <li><strong>Forms Working</strong>: Try submitting forms on different pages</li>
              <li><strong>Donations Working</strong>: Try making a small donation to a project</li>
              <li><strong>Milestones Working</strong>: Try uploading a milestone with a file</li>
              <li><strong>NGO Registration</strong>: Try registering as an NGO</li>
            </ul>
          </div>
          
          <div className={styles.card}>
            <h2>Common Issues</h2>
            <ul>
              <li><strong>MetaMask not connecting</strong>: Try refreshing and unlocking your wallet</li>
              <li><strong>Contract errors</strong>: Check if the contract address is correct</li>
              <li><strong>IPFS errors</strong>: Verify your Pinata API keys in the backend</li>
              <li><strong>Transaction failures</strong>: Make sure you have enough ETH for gas</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
