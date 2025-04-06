import Web3 from 'web3';
import D3RProtocolABI from '../contracts/D3RProtocol.json';
import MilestoneFundingABI from '../contracts/MilestoneFunding.json';
import NGORegistryABI from '../contracts/NGORegistry.json';
import ChainlinkDisasterOracleABI from '../contracts/ChainlinkDisasterOracle.json';
import IPFSVerifierABI from '../contracts/IPFSVerifier.json';
import FundPoolABI from '../contracts/FundPool.json';
import DonationTrackerABI from '../contracts/DonationTracker.json';

let web3;
let d3rProtocol;
let milestoneFunding;
let ngoRegistry;
let disasterOracle;
let ipfsVerifier;
let fundPool;
let donationTracker;

// Contract addresses - deployed contract addresses
const D3R_PROTOCOL_ADDRESS = '0xB0C04bF81c2D64cC5Ae4CCeaFe6906D391476304';
const MILESTONE_FUNDING_ADDRESS = '0xD09c0b1677107e25B78271dA70295580Bf8BEA52';
const NGO_REGISTRY_ADDRESS = '0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01';
const DISASTER_ORACLE_ADDRESS = '0x109457d4c8501174f774339E4B37635e3f818C94';
const IPFS_VERIFIER_ADDRESS = '0x4DF627FCDf639D6a4dc420924Df6709e404493c4';
const FUND_POOL_ADDRESS = '0x52146d464e5DD3a7046940b85231007385AB3105';
const DONATION_TRACKER_ADDRESS = '0x97154aCFa6f5E85494D0EFd2332368b13b2Da8dc';

// Disaster types defined in the system
export const DISASTER_TYPES = {
  EARTHQUAKE: 'Earthquake',
  HURRICANE: 'Hurricane',
  FLOOD: 'Flood',
  WILDFIRE: 'Wildfire',
  DROUGHT: 'Drought',
  TSUNAMI: 'Tsunami',
  VOLCANIC_ERUPTION: 'Volcanic Eruption',
  PANDEMIC: 'Pandemic',
  OTHER: 'Other'
};

// Urgency levels defined in the system
export const URGENCY_LEVELS = {
  'Critical (Level 5)': 5,
  'High (Level 4)': 4,
  'Medium (Level 3)': 3,
  'Low (Level 2)': 2,
  'Recovery (Level 1)': 1
};

// Initialize Web3 and contract instances
export const initWeb3 = async () => {
  try {
    let accounts = [];
    
    // Check if we're in a browser and if ethereum is injected
    if (typeof window !== 'undefined' && window.ethereum) {
      console.log("Found window.ethereum, attempting to connect");
      
      try {
        // Request account access if needed
        accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Accounts: ", accounts);
        
        // Create Web3 instance
        web3 = new Web3(window.ethereum);
        
        // Set up event listeners for account/network changes
        window.ethereum.on('accountsChanged', (newAccounts) => {
          console.log('accountsChanged', newAccounts);
          // Reload the page to reset the state
          window.location.reload();
        });
        
        window.ethereum.on('chainChanged', (chainId) => {
          console.log('chainChanged', chainId);
          // Reload the page to reset the state
          window.location.reload();
        });
        
        window.ethereum.on('disconnect', () => {
          console.log('disconnect');
          web3 = null;
          // Reload the page to reset the state
          window.location.reload();
        });
        
      } catch (error) {
        console.error("Error requesting account access:", error);
        // Don't throw, continue with read-only access
      }
    } else if (typeof window !== 'undefined' && window.web3) {
      // Legacy support for older MetaMask/Web3 implementations
      console.log("Found legacy web3");
      web3 = new Web3(window.web3.currentProvider);
      accounts = await web3.eth.getAccounts();
    } else {
      console.log("No Web3 wallet detected, using read-only provider");
      // Set up a read-only provider for non-wallet users
      const provider = new Web3.providers.HttpProvider(
        "https://eth-sepolia.g.alchemy.com/v2/demo"
      );
      web3 = new Web3(provider);
    }
    
    // Initialize contract instances only if web3 is setup
    if (web3) {
      try {
        d3rProtocol = new web3.eth.Contract(D3RProtocolABI.abi, D3R_PROTOCOL_ADDRESS);
        milestoneFunding = new web3.eth.Contract(MilestoneFundingABI.abi, MILESTONE_FUNDING_ADDRESS);
        ngoRegistry = new web3.eth.Contract(NGORegistryABI.abi, NGO_REGISTRY_ADDRESS);
        disasterOracle = new web3.eth.Contract(ChainlinkDisasterOracleABI.abi, DISASTER_ORACLE_ADDRESS);
        ipfsVerifier = new web3.eth.Contract(IPFSVerifierABI.abi, IPFS_VERIFIER_ADDRESS);
        fundPool = new web3.eth.Contract(FundPoolABI.abi, FUND_POOL_ADDRESS);
        donationTracker = new web3.eth.Contract(DonationTrackerABI.abi, DONATION_TRACKER_ADDRESS);
        
        window.web3 = web3; // Make web3 available globally for utility functions
      } catch (contractError) {
        console.error("Error initializing contracts:", contractError);
      }
    }
    
    return { web3, accounts };
  } catch (error) {
    console.error("Error initializing web3:", error);
    return { web3: null, accounts: [] };
  }
};

// Check connection status
export const checkWeb3Connection = async () => {
  try {
    const { web3, accounts } = await initWeb3();
    
    if (!web3) {
      return 'Web3 not available';
    }
    
    if (!accounts || accounts.length === 0) {
      return 'Not connected to wallet';
    }
    
    const networkId = await web3.eth.net.getId();
    const networkType = await web3.eth.net.getNetworkType();
    
    return `Connected to ${accounts[0]} on ${networkType} (${networkId})`;
  } catch (error) {
    console.error("Connection check failed:", error);
    return `Connection error: ${error.message}`;
  }
};

// Connect wallet explicitly (for connect button)
export const connectWallet = async () => {
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      // Reinitialize web3
      const result = await initWeb3();
      
      // Check if we're on the right network
      const networkId = await web3.eth.net.getId();
      const expectedNetwork = process.env.NEXT_PUBLIC_NETWORK_ID || '1';
      
      if (networkId.toString() !== expectedNetwork) {
        const networkName = process.env.NEXT_PUBLIC_NETWORK_NAME || 'Ethereum Mainnet';
        
        // Prompt user to switch networks
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${parseInt(expectedNetwork).toString(16)}` }],
          });
        } catch (switchError) {
          console.error("Failed to switch networks:", switchError);
          return { 
            success: false, 
            error: `Please switch to ${networkName} in your wallet` 
          };
        }
      }
      
      return { 
        success: true, 
        address: accounts[0],
        networkId
      };
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      return { 
        success: false, 
        error: error.message || "Failed to connect wallet" 
      };
    }
  } else {
    return { 
      success: false, 
      error: "No Ethereum wallet detected. Please install MetaMask." 
    };
  }
};

// Get all active relief campaigns with verification status
export const getReliefCampaigns = async (filters = {}) => {
  try {
    await initWeb3();
    
    // Get project count
    const projectCount = await milestoneFunding.methods.projectCount().call();
    const campaigns = [];
    
    // Load all projects
    for (let i = 0; i < projectCount; i++) {
      try {
        const projectDetails = await milestoneFunding.methods.getProjectDetails(i).call();
        
        // Only include active projects
        if (projectDetails.isActive) {
          // Try to get metadata about the disaster (could be stored in IPFS or as events)
          let metadata = {};
          try {
            // In a production environment, we would fetch metadata from IPFS or blockchain events
            // For now, we'll use placeholder data
            const disasterType = getRandomDisasterType(i);
            const disasterId = `DS-${2023}-${1000 + i}`;
            
            metadata = {
              disasterType: disasterType,
              location: getLocationForDisasterType(disasterType),
              disasterId: disasterId,
              urgencyLevel: getUrgencyForDisasterType(disasterType)
            };
            
            // Try to get verification from the Oracle contract
            try {
              const verification = await disasterOracle.methods.getDisasterVerification(disasterId).call();
              metadata.verified = verification.verified;
              metadata.confidence = verification.confidence;
              metadata.source = verification.source || "Chainlink Oracles";
            } catch (verificationError) {
              console.log(`Could not get verification for disaster ${disasterId}`, verificationError);
              metadata.verified = i % 3 === 0; // For testing: make every third project verified
              metadata.confidence = metadata.verified ? 85 : 0;
              metadata.source = metadata.verified ? "Chainlink Weather Data" : "";
            }
          } catch (metadataError) {
            console.error(`Error fetching metadata for project ${i}:`, metadataError);
          }
          
          // Apply filters if provided
          if (
            (filters.disasterType && metadata.disasterType !== filters.disasterType) ||
            (filters.location && !metadata.location?.toLowerCase().includes(filters.location.toLowerCase())) ||
            (filters.urgency > 0 && metadata.urgencyLevel !== parseInt(filters.urgency))
          ) {
            continue; // Skip this campaign if it doesn't match filters
          }
          
          // Get milestone information
          const milestones = [];
          for (let j = 0; j < projectDetails.milestoneCount; j++) {
            try {
              const milestone = await milestoneFunding.methods.getMilestoneDetails(i, j).call();
              milestones.push({
                ...milestone,
                id: j
              });
            } catch (milestoneError) {
              console.error(`Error fetching milestone ${j} for project ${i}:`, milestoneError);
            }
          }
          
          // Get NGO details
          let ngoDetails = { name: "Unknown NGO" };
          try {
            ngoDetails = await ngoRegistry.methods.getNGODetails(projectDetails.ngoAddress).call();
          } catch (ngoError) {
            console.error(`Error fetching NGO details for address ${projectDetails.ngoAddress}:`, ngoError);
          }
          
          // Add campaign to the list
          campaigns.push({
            id: i,
            title: projectDetails.name,
            description: projectDetails.description,
            creator: projectDetails.ngoAddress,
            ngoName: ngoDetails.name || "Unknown NGO",
            currentAmount: projectDetails.releasedFunding,
            targetAmount: projectDetails.totalFunding,
            milestonesCompleted: parseInt(projectDetails.milestonesCompleted),
            milestoneCount: parseInt(projectDetails.milestoneCount),
            milestones: milestones,
            isActive: projectDetails.isActive,
            deadline: calculateDeadline(i),
            parsedMetadata: metadata
          });
        }
      } catch (projectError) {
        console.error(`Error loading project ${i}:`, projectError);
      }
    }
    
    return campaigns;
  } catch (error) {
    console.error("Error getting relief campaigns:", error);
    throw error;
  }
};

// Donate to a relief campaign
export const donate = async (campaignId, amount) => {
  try {
    const { web3, accounts } = await initWeb3();
    if (!accounts || accounts.length === 0) {
      throw new Error("No connected wallet accounts");
    }
    
    const amountWei = web3.utils.toWei(amount.toString(), 'ether');
    
    // Get the project details to check if it's active
    const projectDetails = await milestoneFunding.methods.getProjectDetails(campaignId).call();
    if (!projectDetails.isActive) {
      throw new Error("This relief project is no longer active");
    }
    
    // There's no direct donation method in MilestoneFunding in the contract code
    // We'll use D3RProtocol to handle the donation
    try {
      // Try to donate via the main protocol contract
      await d3rProtocol.methods.donateToProject(campaignId).send({
        from: accounts[0],
        value: amountWei
      });
    } catch (protocolError) {
      console.error("D3RProtocol donation failed, trying direct transaction:", protocolError);
      
      // If the protocol doesn't have a donateToProject method, try a direct transaction
      await web3.eth.sendTransaction({
        from: accounts[0],
        to: MILESTONE_FUNDING_ADDRESS,
        value: amountWei,
        data: web3.eth.abi.encodeFunctionCall({
          name: 'addFundsToProject', // This function name depends on your actual contract implementation
          type: 'function',
          inputs: [{ type: 'uint256', name: 'projectId' }]
        }, [campaignId])
      });
    }
    
    return true;
  } catch (error) {
    console.error("Error donating to campaign:", error);
    throw error;
  }
};

// Get verification status of a relief campaign
export const getVerificationStatus = async (disasterId) => {
  try {
    await initWeb3();
    const verification = await disasterOracle.methods.getDisasterVerification(disasterId).call();
    return verification;
  } catch (error) {
    console.error("Error getting verification status:", error);
    return {
      verified: false,
      confidence: 0,
      source: "Error retrieving data",
      timestamp: 0
    };
  }
};

// Get NGO details
export const getNGODetails = async (ngoAddress) => {
  try {
    await initWeb3();
    const ngoDetails = await ngoRegistry.methods.getNGODetails(ngoAddress).call();
    return ngoDetails;
  } catch (error) {
    console.error("Error getting NGO details:", error);
    return null;
  }
};

// Get dashboard stats
export const getDashboardStats = async () => {
  try {
    const { web3 } = await initWeb3();
    
    // Get NGO count
    let verifiedNGOsCount = 0;
    try {
      verifiedNGOsCount = await ngoRegistry.methods.getVerifiedNGOsCount().call();
    } catch (ngoError) {
      console.error("Error getting verified NGO count:", ngoError);
    }
    
    // Get project count and calculate total funding and people helped
    let projectCount = 0;
    try {
      projectCount = await milestoneFunding.methods.projectCount().call();
    } catch (projectError) {
      console.error("Error getting project count:", projectError);
    }
    
    // Safely create a BigNumber (if web3.utils.toBN isn't available, use standard string handling)
    let totalDonations = "0";
    let totalDonationsBN;

    try {
      // Check if web3.utils has the toBN function
      if (web3 && web3.utils && typeof web3.utils.toBN === 'function') {
        totalDonationsBN = web3.utils.toBN("0");
      } else {
        // Fallback to string-based handling
        totalDonations = "0";
      }
    } catch (error) {
      console.error("Error with BigNumber handling:", error);
      totalDonations = "0";
    }
    
    let activeCampaigns = 0;
    let totalPeopleHelped = 0;
    
    for (let i = 0; i < projectCount; i++) {
      try {
        const projectDetails = await milestoneFunding.methods.getProjectDetails(i).call();
        
        // Handle the total donations amount safely
        try {
          if (totalDonationsBN) {
            // Use BN addition if available
            totalDonationsBN = totalDonationsBN.add(web3.utils.toBN(projectDetails.totalFunding));
          } else {
            // Fallback to simple string/number handling
            const fundingInEther = web3 && web3.utils 
              ? web3.utils.fromWei(projectDetails.totalFunding, 'ether')
              : parseFloat(projectDetails.totalFunding) / 1e18;
            
            totalDonations = (parseFloat(totalDonations) + parseFloat(fundingInEther)).toString();
          }
        } catch (bnError) {
          console.error("Error adding to donation total:", bnError);
          // Fallback to simple addition
          totalDonations = (parseFloat(totalDonations) + parseFloat(projectDetails.totalFunding) / 1e18).toFixed(4);
        }
        
        if (projectDetails.isActive) {
          activeCampaigns++;
          // In a real scenario, you'd have a way to track people helped per project
          // For now, use a formula based on project funding and milestones
          const totalFundingEth = web3 && web3.utils
            ? parseFloat(web3.utils.fromWei(projectDetails.totalFunding, 'ether'))
            : parseFloat(projectDetails.totalFunding) / 1e18;
            
          const peopleHelpedEstimate = Math.floor(totalFundingEth * 150);
          totalPeopleHelped += peopleHelpedEstimate;
        }
      } catch (error) {
        console.error(`Error getting details for project ${i}:`, error);
      }
    }
    
    // Format the final totalDonations value
    let formattedDonations;
    
    if (totalDonationsBN) {
      formattedDonations = web3.utils.fromWei(totalDonationsBN, 'ether');
    } else {
      // If we've been tracking in ether already, use that value
      formattedDonations = totalDonations;
    }
    
    return {
      totalDonations: formattedDonations,
      activeCampaigns,
      peopleHelped: totalPeopleHelped,
      verifiedNGOs: parseInt(verifiedNGOsCount)
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    // Return dummy data as fallback
    return {
      totalDonations: "0",
      activeCampaigns: 0,
      peopleHelped: 0,
      verifiedNGOs: 0
    };
  }
};

// Helper functions for generating test data
function getRandomDisasterType(seed) {
  const types = Object.values(DISASTER_TYPES);
  return types[seed % types.length];
}

function getLocationForDisasterType(disasterType) {
  const locations = {
    [DISASTER_TYPES.EARTHQUAKE]: "Port-au-Prince, Haiti",
    [DISASTER_TYPES.HURRICANE]: "New Orleans, USA",
    [DISASTER_TYPES.FLOOD]: "Kerala, India",
    [DISASTER_TYPES.WILDFIRE]: "California, USA",
    [DISASTER_TYPES.DROUGHT]: "Nairobi, Kenya",
    [DISASTER_TYPES.TSUNAMI]: "Phuket, Thailand",
    [DISASTER_TYPES.VOLCANIC_ERUPTION]: "Bali, Indonesia",
    [DISASTER_TYPES.PANDEMIC]: "Global Response",
    [DISASTER_TYPES.OTHER]: "Multiple Regions"
  };
  
  return locations[disasterType] || "Unknown Location";
}

function getUrgencyForDisasterType(disasterType) {
  const urgencies = {
    [DISASTER_TYPES.EARTHQUAKE]: 5,
    [DISASTER_TYPES.HURRICANE]: 4,
    [DISASTER_TYPES.FLOOD]: 4,
    [DISASTER_TYPES.WILDFIRE]: 3,
    [DISASTER_TYPES.DROUGHT]: 2,
    [DISASTER_TYPES.TSUNAMI]: 5,
    [DISASTER_TYPES.VOLCANIC_ERUPTION]: 3,
    [DISASTER_TYPES.PANDEMIC]: 4,
    [DISASTER_TYPES.OTHER]: 3
  };
  
  return urgencies[disasterType] || 3;
}

function calculateDeadline(projectId) {
  // Create deterministic but varied deadlines
  const now = Math.floor(Date.now() / 1000);
  const daysFromNow = 10 + (projectId * 5) % 60; // Between 10 and 70 days
  return now + (daysFromNow * 24 * 60 * 60);
}

// Check if an NGO is verified
export const isNGOVerified = async (ngoAddress) => {
  try {
    await initWeb3();
    const isVerified = await ngoRegistry.methods.isVerified(ngoAddress).call();
    return isVerified;
  } catch (error) {
    console.error("Error checking if NGO is verified:", error);
    return false;
  }
};

// Verify document on IPFS
export const verifyIPFSDocument = async (cid) => {
  try {
    const { accounts } = await initWeb3();
    await ipfsVerifier.methods.verifyDocument(cid).send({ from: accounts[0] });
    return true;
  } catch (error) {
    console.error("Error verifying IPFS document:", error);
    throw error;
  }
};

// Get contract addresses for frontend display
export const getContractAddresses = () => {
  return {
    d3rProtocol: D3R_PROTOCOL_ADDRESS,
    milestoneFunding: MILESTONE_FUNDING_ADDRESS,
    ngoRegistry: NGO_REGISTRY_ADDRESS,
    disasterOracle: DISASTER_ORACLE_ADDRESS,
    ipfsVerifier: IPFS_VERIFIER_ADDRESS,
    fundPool: FUND_POOL_ADDRESS,
    donationTracker: DONATION_TRACKER_ADDRESS
  };
};

export default {
  initWeb3,
  getReliefCampaigns,
  donate,
  getVerificationStatus,
  getNGODetails,
  getDashboardStats,
  isNGOVerified,
  verifyIPFSDocument,
  getContractAddresses,
  DISASTER_TYPES,
  URGENCY_LEVELS,
  checkWeb3Connection,
  connectWallet
};
