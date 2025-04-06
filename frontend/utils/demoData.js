/**
 * This module provides demo/mock data for the D3R platform
 * to ensure the UI looks good even without a blockchain connection
 */

// Import the constants directly to avoid circular dependency
import { DISASTER_TYPES } from './constants';

// Mock dashboard stats
export const getDemoStats = () => {
  return {
    totalDonations: "45.832",
    activeCampaigns: 7,
    peopleHelped: 12680,
    verifiedNGOs: 24
  };
};

// Demo NGO data
const DEMO_NGOS = [
  {
    address: '0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01',
    name: 'Global Relief Initiative',
    website: 'www.global-relief.org',
    contact: 'contact@global-relief.org',
    verified: true
  },
  {
    address: '0xD09c0b1677107e25B78271dA70295580Bf8BEA52',
    name: 'Disaster Response Network',
    website: 'www.disaster-response.org',
    contact: 'help@disaster-response.org',
    verified: true
  },
  {
    address: '0x4DF627FCDf639D6a4dc420924Df6709e404493c4',
    name: 'Emergency Action Coalition',
    website: 'www.emergency-action.org',
    contact: 'info@emergency-action.org',
    verified: true
  },
  {
    address: '0x52146d464e5DD3a7046940b85231007385AB3105',
    name: 'Humanitarian Frontiers',
    website: 'www.humanitarian-frontiers.org',
    contact: 'support@humanitarian-frontiers.org',
    verified: true
  }
];

// Demo relief campaigns
const DEMO_CAMPAIGNS = [
  {
    id: 0,
    title: "Haiti Earthquake Relief Fund",
    description: "Supporting emergency relief and recovery efforts following the 7.2 magnitude earthquake in Haiti. Funds will be used for medical care, shelter, food, water, and long-term recovery assistance.",
    creator: "0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01",
    ngoName: "Global Relief Initiative",
    currentAmount: "15000000000000000000",  // 15 ETH
    targetAmount: "50000000000000000000",   // 50 ETH
    milestonesCompleted: 2,
    milestoneCount: 5,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 30*24*60*60, // 30 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.EARTHQUAKE,
      location: "Port-au-Prince, Haiti",
      disasterId: "EQ-2023-1001",
      urgencyLevel: 5,
      verified: true,
      confidence: 95,
      source: "USGS Seismic Network"
    }
  },
  {
    id: 1,
    title: "California Wildfire Recovery",
    description: "Supporting communities affected by the devastating wildfires in California. Funds will help with immediate needs, temporary housing, and rebuilding efforts for families who lost their homes.",
    creator: "0xD09c0b1677107e25B78271dA70295580Bf8BEA52",
    ngoName: "Disaster Response Network",
    currentAmount: "8500000000000000000",  // 8.5 ETH
    targetAmount: "30000000000000000000",  // 30 ETH
    milestonesCompleted: 1,
    milestoneCount: 4,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 45*24*60*60, // 45 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.WILDFIRE,
      location: "Northern California, USA",
      disasterId: "WF-2023-1002",
      urgencyLevel: 3,
      verified: true,
      confidence: 90,
      source: "Cal Fire Agency"
    }
  },
  {
    id: 2,
    title: "Kerala Flood Response",
    description: "Providing emergency relief for communities affected by severe flooding in Kerala, India. Funds will support rescue operations, medical aid, clean water, and sanitation efforts.",
    creator: "0x4DF627FCDf639D6a4dc420924Df6709e404493c4",
    ngoName: "Emergency Action Coalition",
    currentAmount: "20000000000000000000",  // 20 ETH
    targetAmount: "40000000000000000000",  // 40 ETH
    milestonesCompleted: 2,
    milestoneCount: 4,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 20*24*60*60, // 20 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.FLOOD,
      location: "Kerala, India",
      disasterId: "FL-2023-1003",
      urgencyLevel: 4,
      verified: true,
      confidence: 85,
      source: "Indian Meteorological Department"
    }
  },
  {
    id: 3,
    title: "Hurricane Ian Recovery",
    description: "Supporting communities devastated by Hurricane Ian. Funds will be directed to emergency shelter, food, water, medical care, and long-term rebuilding efforts.",
    creator: "0x52146d464e5DD3a7046940b85231007385AB3105",
    ngoName: "Humanitarian Frontiers",
    currentAmount: "12000000000000000000",  // 12 ETH
    targetAmount: "35000000000000000000",  // 35 ETH
    milestonesCompleted: 1,
    milestoneCount: 3,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 25*24*60*60, // 25 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.HURRICANE,
      location: "Florida, USA",
      disasterId: "HU-2023-1004",
      urgencyLevel: 4,
      verified: true,
      confidence: 98,
      source: "NOAA Weather Service"
    }
  },
  {
    id: 4,
    title: "Drought Relief for Kenya",
    description: "Addressing the severe drought affecting communities across Kenya. Funds will provide water, food security interventions, livestock support, and sustainable agriculture solutions.",
    creator: "0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01",
    ngoName: "Global Relief Initiative",
    currentAmount: "5000000000000000000",  // 5 ETH
    targetAmount: "25000000000000000000",  // 25 ETH
    milestonesCompleted: 0,
    milestoneCount: 4,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 60*24*60*60, // 60 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.DROUGHT,
      location: "Nairobi, Kenya",
      disasterId: "DR-2023-1005",
      urgencyLevel: 2,
      verified: true,
      confidence: 80,
      source: "Famine Early Warning Systems"
    }
  },
  {
    id: 5,
    title: "Bali Volcanic Eruption Relief",
    description: "Assisting communities affected by the volcanic eruption in Bali. Funds will support evacuation efforts, temporary shelter, air quality monitoring, and medical assistance.",
    creator: "0xD09c0b1677107e25B78271dA70295580Bf8BEA52",
    ngoName: "Disaster Response Network",
    currentAmount: "3200000000000000000",  // 3.2 ETH
    targetAmount: "15000000000000000000",  // 15 ETH
    milestonesCompleted: 0,
    milestoneCount: 3,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 40*24*60*60, // 40 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.VOLCANIC_ERUPTION,
      location: "Bali, Indonesia",
      disasterId: "VO-2023-1006",
      urgencyLevel: 3,
      verified: false,
      confidence: 0,
      source: ""
    }
  },
  {
    id: 6,
    title: "COVID-19 Response for Rural Communities",
    description: "Providing critical medical supplies, oxygen concentrators, and vaccination support for underserved rural communities battling COVID-19 waves.",
    creator: "0x4DF627FCDf639D6a4dc420924Df6709e404493c4",
    ngoName: "Emergency Action Coalition",
    currentAmount: "7800000000000000000",  // 7.8 ETH
    targetAmount: "20000000000000000000",  // 20 ETH
    milestonesCompleted: 1,
    milestoneCount: 2,
    isActive: true,
    deadline: Math.floor(Date.now()/1000) + 15*24*60*60, // 15 days
    parsedMetadata: {
      disasterType: DISASTER_TYPES.PANDEMIC,
      location: "Global Response",
      disasterId: "PA-2023-1007",
      urgencyLevel: 4,
      verified: true,
      confidence: 92,
      source: "World Health Organization"
    }
  }
];

// Demo milestones for campaigns
export const getDemoMilestones = (campaignId) => {
  const defaultMilestones = [
    {
      description: "Initial emergency response and needs assessment",
      verificationType: "IPFS Documentation",
      fundPercentage: 25,
      isCompleted: true,
      proofCID: "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxX",
      verificationTimestamp: Math.floor(Date.now()/1000) - 7*24*60*60 // 7 days ago
    },
    {
      description: "Distribution of emergency supplies and medical aid",
      verificationType: "IPFS Documentation + Oracle",
      fundPercentage: 25,
      isCompleted: false,
      proofCID: "",
      verificationTimestamp: 0
    },
    {
      description: "Temporary shelter and infrastructure repair",
      verificationType: "IPFS Documentation + Oracle + Community Vote",
      fundPercentage: 30,
      isCompleted: false,
      proofCID: "",
      verificationTimestamp: 0
    },
    {
      description: "Long-term recovery and resilience building",
      verificationType: "Multi-signature verification",
      fundPercentage: 20,
      isCompleted: false,
      proofCID: "",
      verificationTimestamp: 0
    }
  ];

  // Custom milestone sets for each campaign ID
  const milestoneSets = {
    0: defaultMilestones.map((m, idx) => ({...m, isCompleted: idx < 2})), // First 2 completed
    1: defaultMilestones.map((m, idx) => ({...m, isCompleted: idx < 1})), // First 1 completed
    2: defaultMilestones.map((m, idx) => ({...m, isCompleted: idx < 2})), // First 2 completed
    3: [
      {
        description: "Emergency evacuation and immediate relief",
        verificationType: "IPFS Documentation",
        fundPercentage: 40,
        isCompleted: true,
        proofCID: "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxY",
        verificationTimestamp: Math.floor(Date.now()/1000) - 5*24*60*60 // 5 days ago
      },
      {
        description: "Community shelter and infrastructure stabilization",
        verificationType: "IPFS Documentation + Oracle",
        fundPercentage: 30,
        isCompleted: false,
        proofCID: "",
        verificationTimestamp: 0
      },
      {
        description: "Long-term recovery and rebuilding",
        verificationType: "Multi-signature verification",
        fundPercentage: 30,
        isCompleted: false,
        proofCID: "",
        verificationTimestamp: 0
      }
    ],
    6: [
      {
        description: "Distribution of medical supplies and oxygen concentrators",
        verificationType: "IPFS Documentation + Oracle",
        fundPercentage: 60,
        isCompleted: true,
        proofCID: "QmT5NvUtoM5nWFfrQdVrFtvGfKFmG7AHE8P34isapyhCxZ",
        verificationTimestamp: Math.floor(Date.now()/1000) - 3*24*60*60 // 3 days ago
      },
      {
        description: "Vaccination campaign and healthcare worker support",
        verificationType: "Multi-signature verification",
        fundPercentage: 40,
        isCompleted: false,
        proofCID: "",
        verificationTimestamp: 0
      }
    ]
  };

  return milestoneSets[campaignId] || defaultMilestones.slice(0, Math.min(4, campaignId + 2));
};

// Get a specific NGO by address
export const getDemoNGO = (address) => {
  return DEMO_NGOS.find(ngo => ngo.address.toLowerCase() === address.toLowerCase()) || DEMO_NGOS[0];
};

// Get all demo campaigns
export const getDemoCampaigns = (filters = {}) => {
  let campaigns = [...DEMO_CAMPAIGNS];
  
  // Apply filters if provided
  if (filters.disasterType) {
    campaigns = campaigns.filter(c => c.parsedMetadata.disasterType === filters.disasterType);
  }
  
  if (filters.location) {
    campaigns = campaigns.filter(c => 
      c.parsedMetadata.location.toLowerCase().includes(filters.location.toLowerCase())
    );
  }
  
  if (filters.urgency && parseInt(filters.urgency) > 0) {
    campaigns = campaigns.filter(c => c.parsedMetadata.urgencyLevel === parseInt(filters.urgency));
  }
  
  return campaigns;
};

// Get a specific campaign
export const getDemoCampaign = (id) => {
  return DEMO_CAMPAIGNS.find(c => c.id.toString() === id?.toString());
};

// Demo verification status
export const getDemoVerification = (disasterId) => {
  const campaign = DEMO_CAMPAIGNS.find(c => c.parsedMetadata.disasterId === disasterId);
  
  if (campaign) {
    return {
      verified: campaign.parsedMetadata.verified,
      confidence: campaign.parsedMetadata.confidence,
      source: campaign.parsedMetadata.source,
      timestamp: Math.floor(Date.now()/1000) - 14*24*60*60 // 14 days ago
    };
  }
  
  return {
    verified: false,
    confidence: 0,
    source: "Not found",
    timestamp: 0
  };
};

export default {
  getDemoStats,
  getDemoCampaigns,
  getDemoCampaign,
  getDemoMilestones,
  getDemoNGO,
  getDemoVerification
};
