/**
 * Shared constants across the D3R platform
 */

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

// Contract addresses - deployed contract addresses
export const CONTRACT_ADDRESSES = {
  D3R_PROTOCOL: '0xB0C04bF81c2D64cC5Ae4CCeaFe6906D391476304',
  MILESTONE_FUNDING: '0xD09c0b1677107e25B78271dA70295580Bf8BEA52',
  NGO_REGISTRY: '0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01',
  DISASTER_ORACLE: '0x109457d4c8501174f774339E4B37635e3f818C94',
  IPFS_VERIFIER: '0x4DF627FCDf639D6a4dc420924Df6709e404493c4',
  FUND_POOL: '0x52146d464e5DD3a7046940b85231007385AB3105',
  DONATION_TRACKER: '0x97154aCFa6f5E85494D0EFd2332368b13b2Da8dc'
};

export default {
  DISASTER_TYPES,
  URGENCY_LEVELS,
  CONTRACT_ADDRESSES
};
