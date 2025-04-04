require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { saveContractAddresses } = require('../config/contracts');

// Check if we have Foundry installed
function isFoundryInstalled() {
  try {
    const result = execSync('forge --version', { 
      stdio: 'pipe',
      env: { ...process.env, PATH: `${process.env.PATH}:${require('os').homedir()}/.foundry/bin` }
    });
    console.log('Forge detected:', result.toString().trim());
    return true;
  } catch (error) {
    console.log('Forge not detected in PATH');
    return false;
  }
}

// Deploy using Foundry
async function deployWithFoundry() {
  console.log('Deploying with Foundry...');
  try {
    // Create a log file to capture the output
    const logFile = path.join(__dirname, '..', 'forge-deploy-log.txt');
    
    // Check if we're in WSL and need path conversion
    const isWsl = process.platform === 'linux' && /Microsoft/.test(execSync('uname -r').toString());
    const projectDir = path.resolve(__dirname, '..');
    let projectPath = projectDir;
    
    if (isWsl && projectDir.includes(':\\')) {
      // Convert Windows path to WSL path
      const drive = projectDir.charAt(0).toLowerCase();
      const pathWithoutDrive = projectDir.substring(2).replace(/\\/g, '/');
      projectPath = `/mnt/${drive}${pathWithoutDrive}`;
    }
    
    console.log(`Using project path: ${projectPath}`);
    
    // Execute the forge script command and capture output
    const command = `cd "${projectPath}" && forge script script/Deploy.s.sol --rpc-url ${process.env.RPC_URL} --private-key ${process.env.PRIVATE_KEY} --broadcast`;
    console.log(`Running: ${command.replace(process.env.PRIVATE_KEY, '***private-key***')}`);
    
    const output = execSync(command, { 
      encoding: 'utf8',
      env: { ...process.env, PATH: `${process.env.PATH}:${require('os').homedir()}/.foundry/bin` }
    });
    fs.writeFileSync(logFile, output);
    console.log('Deployment successful!');
    console.log('Deployment log saved to forge-deploy-log.txt');
    
    // Parse the log and save addresses
    const addresses = parseForgeOutput(output);
    if (addresses && Object.keys(addresses).length > 0) {
      saveContractAddresses(addresses);
      console.log('Contract addresses saved successfully!');
      displayAddresses(addresses);
    }
    
    return true;
  } catch (error) {
    console.error('Deployment failed:', error.message);
    return false;
  }
}

// Parse forge output to extract contract addresses
function parseForgeOutput(output) {
  try {
    const addresses = {};
    
    // Extract contract addresses using regex
    const ngoRegistryMatch = output.match(/NGORegistry deployed at: (0x[a-fA-F0-9]{40})/);
    const fundPoolMatch = output.match(/FundPool deployed at: (0x[a-fA-F0-9]{40})/);
    const donationTrackerMatch = output.match(/DonationTracker deployed at: (0x[a-fA-F0-9]{40})/);
    const chainlinkOracleMatch = output.match(/ChainlinkDisasterOracle deployed at: (0x[a-fA-F0-9]{40})/);
    
    if (ngoRegistryMatch) addresses.ngoRegistry = ngoRegistryMatch[1];
    if (fundPoolMatch) addresses.fundPool = fundPoolMatch[1];
    if (donationTrackerMatch) addresses.donationTracker = donationTrackerMatch[1];
    if (chainlinkOracleMatch) addresses.chainlinkOracle = chainlinkOracleMatch[1];
    
    return addresses;
  } catch (error) {
    console.error('Error parsing deployment output:', error);
    return null;
  }
}

// Deploy using ethers.js directly (fallback if Foundry not installed)
async function deployWithEthers() {
  console.log('Foundry not available for npm scripts. Using ethers.js for deployment...');
  
  try {
    // Load contract artifacts
    const NGORegistryArtifact = require('../out/NGORegistry.sol/NGORegistry.json');
    const FundPoolArtifact = require('../out/FundPool.sol/FundPool.json');
    const DonationTrackerArtifact = require('../out/DonationTracker.sol/DonationTracker.json');
    const ChainlinkOracleArtifact = require('../out/ChainlinkDisasterOracle.sol/ChainlinkDisasterOracle.json');
    
    // Setup provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const addresses = {};
    
    console.log('Connected to network:', (await provider.getNetwork()).name);
    console.log('Deployer address:', wallet.address);
    
    // Owner address
    const owner = wallet.address;
    
    // Deploy NGORegistry
    console.log('Deploying NGORegistry...');
    const NGORegistryFactory = new ethers.ContractFactory(
      NGORegistryArtifact.abi, 
      NGORegistryArtifact.bytecode.object, 
      wallet
    );
    const ngoRegistry = await NGORegistryFactory.deploy(owner);
    await ngoRegistry.deployed();
    console.log('NGORegistry deployed at:', ngoRegistry.address);
    addresses.ngoRegistry = ngoRegistry.address;
    
    // Deploy FundPool
    console.log('Deploying FundPool...');
    const FundPoolFactory = new ethers.ContractFactory(
      FundPoolArtifact.abi, 
      FundPoolArtifact.bytecode.object, 
      wallet
    );
    const fundPool = await FundPoolFactory.deploy(ngoRegistry.address);
    await fundPool.deployed();
    console.log('FundPool deployed at:', fundPool.address);
    addresses.fundPool = fundPool.address;
    
    // Deploy DonationTracker
    console.log('Deploying DonationTracker...');
    const DonationTrackerFactory = new ethers.ContractFactory(
      DonationTrackerArtifact.abi, 
      DonationTrackerArtifact.bytecode.object, 
      wallet
    );
    const donationTracker = await DonationTrackerFactory.deploy(fundPool.address);
    await donationTracker.deployed();
    console.log('DonationTracker deployed at:', donationTracker.address);
    addresses.donationTracker = donationTracker.address;
    
    // Get Chainlink parameters
    const linkToken = process.env.LINK_TOKEN_ADDRESS;
    const oracle = process.env.CHAINLINK_ORACLE_ADDRESS;
    const jobId = ethers.utils.formatBytes32String(process.env.CHAINLINK_JOB_ID);
    const fee = ethers.utils.parseUnits(process.env.CHAINLINK_FEE || '0.1', 18);
    
    // Deploy ChainlinkOracle
    console.log('Deploying ChainlinkDisasterOracle...');
    const ChainlinkOracleFactory = new ethers.ContractFactory(
      ChainlinkOracleArtifact.abi, 
      ChainlinkOracleArtifact.bytecode.object, 
      wallet
    );
    const chainlinkOracle = await ChainlinkOracleFactory.deploy(
      linkToken,
      oracle,
      jobId,
      fee
    );
    await chainlinkOracle.deployed();
    console.log('ChainlinkDisasterOracle deployed at:', chainlinkOracle.address);
    addresses.chainlinkOracle = chainlinkOracle.address;
    
    // Setup contract relationships
    console.log('Setting up contract relationships...');
    const authTx = await fundPool.setTrackerAuthorization(donationTracker.address, true);
    await authTx.wait();
    console.log('Authorized DonationTracker to release funds');
    
    // Save addresses
    saveContractAddresses(addresses);
    displayAddresses(addresses);
    
    console.log('Deployment complete!');
    return true;
  } catch (error) {
    console.error('Deployment with ethers.js failed:', error);
    console.log('\nPlease make sure your contracts are compiled by running:');
    console.log('forge build');
    console.log('\nOr try deploying directly with forge:');
    console.log('source ~/.bashrc && forge script script/Deploy.s.sol --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast');
    return false;
  }
}

// Display the contract addresses
function displayAddresses(addresses) {
  console.log('\n=== Deployed Contract Addresses ===');
  for (const [name, address] of Object.entries(addresses)) {
    // Format name for display (e.g., ngoRegistry -> NGO Registry)
    const formattedName = name
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
    
    console.log(`${formattedName}: ${address}`);
  }
  console.log('\nUpdate your .env file with these addresses.');
}

// Main function
async function main() {
  console.log('Starting deployment process...');
  
  // Check if required environment variables are set
  if (!process.env.RPC_URL) {
    console.error('Error: RPC_URL not set in .env file');
    process.exit(1);
  }
  
  if (!process.env.PRIVATE_KEY) {
    console.error('Error: PRIVATE_KEY not set in .env file');
    process.exit(1);
  }
  
  // Check if Foundry is installed
  const foundryInstalled = isFoundryInstalled();
  
  // Deploy using appropriate method
  if (foundryInstalled) {
    await deployWithFoundry();
  } else {
    await deployWithEthers();
  }
}

// Run the script
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Deployment failed:', error);
      process.exit(1);
    });
}
