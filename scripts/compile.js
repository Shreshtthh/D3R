const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper function to ensure directory exists
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

// Check if we're running in WSL
function isRunningInWSL() {
  try {
    const output = execSync('uname -a', { encoding: 'utf8' });
    return output.toLowerCase().includes('microsoft') || output.toLowerCase().includes('wsl');
  } catch (error) {
    return false;
  }
}

// Convert Windows path to WSL path
function convertToWslPath(windowsPath) {
  try {
    // Replace backslashes with forward slashes
    let wslPath = windowsPath.replace(/\\/g, '/');
    
    // If path starts with C: (or other drive letter), convert to /mnt/c/
    if (/^[A-Z]:/i.test(wslPath)) {
      const drive = wslPath.charAt(0).toLowerCase();
      wslPath = `/mnt/${drive}/${wslPath.substring(3)}`;
    }
    
    return wslPath;
  } catch (error) {
    console.error('Error converting path:', error);
    return windowsPath;
  }
}

// Attempt to compile using direct command
function compileWithForge() {
  console.log('Attempting to compile with forge directly...');
  try {
    const projectDir = path.resolve(__dirname, '..');
    
    // Run forge command
    execSync('forge --version', { stdio: 'inherit' });
    console.log('Forge found, building contracts...');
    
    // Build contracts
    execSync('forge build', { 
      cwd: projectDir,
      stdio: 'inherit'
    });
    
    console.log('Contracts built successfully!');
    return true;
  } catch (error) {
    console.error('Direct forge command failed:', error.message);
    return false;
  }
}

// Attempt to compile using WSL bash
function compileWithWslBash() {
  console.log('Attempting to compile with WSL bash...');
  try {
    const projectDir = path.resolve(__dirname, '..');
    const wslProjectDir = convertToWslPath(projectDir);
    
    console.log(`Project directory (WSL path): ${wslProjectDir}`);
    
    // Create a special script to run inside WSL
    const compileScript = `
cd "${wslProjectDir}" && \\
export PATH="$HOME/.foundry/bin:$PATH" && \\
forge build
`;
    
    // Execute via WSL
    execSync(`wsl bash -c "${compileScript}"`, { 
      stdio: 'inherit',
      cwd: projectDir
    });
    
    console.log('Contracts built successfully!');
    return true;
  } catch (error) {
    console.error('WSL forge command failed:', error.message);
    return false;
  }
}

// Attempt to manually copy any already-compiled ABIs
function copyExistingABIs() {
  console.log('Looking for existing compiled ABIs...');
  
  const projectDir = path.resolve(__dirname, '..');
  const outDir = path.join(projectDir, 'out');
  const abiDir = path.join(projectDir, 'abis');
  
  ensureDirectoryExists(abiDir);
  
  if (fs.existsSync(outDir)) {
    // Process any existing compiled contracts
    const contracts = [
      { 
        sourceFile: 'NGORegistry.sol/NGORegistry.json',
        targetFile: 'NGORegistry.json'
      },
      { 
        sourceFile: 'FundPool.sol/FundPool.json',
        targetFile: 'FundPool.json'
      },
      { 
        sourceFile: 'DonationTracker.sol/DonationTracker.json',
        targetFile: 'DonationTracker.json'
      },
      { 
        sourceFile: 'ChainlinkDisasterOracle.sol/ChainlinkDisasterOracle.json',
        targetFile: 'ChainlinkOracle.json'
      }
    ];
    
    let foundAny = false;
    
    for (const contract of contracts) {
      const sourcePath = path.join(outDir, contract.sourceFile);
      if (fs.existsSync(sourcePath)) {
        try {
          const content = require(sourcePath);
          fs.writeFileSync(
            path.join(abiDir, contract.targetFile), 
            JSON.stringify(content.abi, null, 2)
          );
          console.log(`Copied ABI for ${contract.targetFile}`);
          foundAny = true;
        } catch (error) {
          console.warn(`Error processing ${sourcePath}:`, error.message);
        }
      } else {
        console.log(`Contract ${contract.sourceFile} not found in output directory`);
      }
    }
    
    return foundAny;
  }
  
  return false;
}

// Create mock ABIs for testing purposes
function createMockABIs() {
  console.log('Creating mock ABIs for testing purposes...');
  
  const projectDir = path.resolve(__dirname, '..');
  const abiDir = path.join(projectDir, 'abis');
  
  ensureDirectoryExists(abiDir);
  
  const mockContracts = [
    {
      name: 'NGORegistry',
      abi: [
        { "type": "constructor", "inputs": [{ "name": "owner", "type": "address" }], "stateMutability": "nonpayable" },
        { "type": "function", "name": "registerNGO", "inputs": [{ "name": "name", "type": "string" }, { "name": "website", "type": "string" }, { "name": "contact", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" },
        { "type": "function", "name": "verifyNGO", "inputs": [{ "name": "ngoAddress", "type": "address" }, { "name": "verified", "type": "bool" }], "outputs": [], "stateMutability": "nonpayable" }
      ]
    },
    {
      name: 'FundPool',
      abi: [
        { "type": "constructor", "inputs": [{ "name": "ngoRegistry", "type": "address" }], "stateMutability": "nonpayable" },
        { "type": "function", "name": "donate", "inputs": [{ "name": "ngo", "type": "address" }], "outputs": [], "stateMutability": "payable" },
        { "type": "function", "name": "registerDisaster", "inputs": [{ "name": "id", "type": "string" }, { "name": "name", "type": "string" }, { "name": "evidenceCID", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" }
      ]
    },
    {
      name: 'DonationTracker',
      abi: [
        { "type": "constructor", "inputs": [{ "name": "fundPool", "type": "address" }], "stateMutability": "nonpayable" },
        { "type": "function", "name": "submitReport", "inputs": [{ "name": "fundId", "type": "uint256" }, { "name": "milestoneIndex", "type": "uint256" }, { "name": "description", "type": "string" }, { "name": "proofCID", "type": "string" }], "outputs": [], "stateMutability": "nonpayable" }
      ]
    },
    {
      name: 'ChainlinkOracle',
      abi: [
        { "type": "constructor", "inputs": [{ "name": "linkToken", "type": "address" }, { "name": "oracle", "type": "address" }, { "name": "jobId", "type": "bytes32" }, { "name": "fee", "type": "uint256" }], "stateMutability": "nonpayable" },
        { "type": "function", "name": "requestDisasterVerification", "inputs": [{ "name": "disasterId", "type": "string" }, { "name": "location", "type": "string" }, { "name": "disasterType", "type": "string" }, { "name": "date", "type": "string" }], "outputs": [{ "name": "requestId", "type": "bytes32" }], "stateMutability": "nonpayable" }
      ]
    }
  ];
  
  for (const contract of mockContracts) {
    fs.writeFileSync(
      path.join(abiDir, `${contract.name}.json`), 
      JSON.stringify(contract.abi, null, 2)
    );
    console.log(`Created mock ABI for ${contract.name}.json`);
  }
  
  return true;
}

// Check if Chainlink dependency is properly installed
function ensureChainlinkDependency() {
  console.log('Checking Chainlink dependency...');
  const projectDir = path.resolve(__dirname, '..');
  const chainlinkDir = path.join(projectDir, 'lib', 'chainlink');
  const chainlinkContractDir = path.join(chainlinkDir, 'contracts', 'src', 'v0.8');
  
  if (!fs.existsSync(chainlinkContractDir) || 
      !fs.existsSync(path.join(chainlinkContractDir, 'ChainlinkClient.sol'))) {
    console.log('Chainlink dependency not found or incomplete. Installing...');
    
    try {
      // Try to install with Forge directly
      execSync('forge install smartcontractkit/chainlink --no-commit', {
        cwd: projectDir,
        stdio: 'inherit'
      });
      
      console.log('Chainlink dependency installed successfully!');
      return true;
    } catch (error) {
      console.error('Failed to install Chainlink with Forge:', error.message);
      
      // If direct forge install fails and on Windows, try with WSL
      if (process.platform === 'win32') {
        try {
          const wslProjectDir = convertToWslPath(projectDir);
          
          const installScript = `
cd "${wslProjectDir}" && \\
export PATH="$HOME/.foundry/bin:$PATH" && \\
forge install smartcontractkit/chainlink --no-commit
`;
          
          execSync(`wsl bash -c "${installScript}"`, {
            stdio: 'inherit',
            cwd: projectDir
          });
          
          console.log('Chainlink dependency installed successfully via WSL!');
          return true;
        } catch (wslError) {
          console.error('Failed to install Chainlink with WSL Forge:', wslError.message);
        }
      }
      
      // If all installation attempts failed, create necessary directories and suggest manual installation
      console.log('Creating placeholder directories for Chainlink. Manual installation may be required.');
      ensureDirectoryExists(chainlinkContractDir);
      return false;
    }
  } else {
    console.log('Chainlink dependency found!');
    return true;
  }
}

// Main function
function main() {
  console.log('Starting contract compilation process...');
  
  // First ensure Chainlink dependency is available
  ensureChainlinkDependency();
  
  // First try with direct forge command
  if (compileWithForge()) {
    copyExistingABIs();
    return;
  }
  
  // If direct command failed and we're on Windows, try with WSL
  if (process.platform === 'win32') {
    if (compileWithWslBash()) {
      copyExistingABIs();
      return;
    }
  }
  
  // If compilation failed but we have existing ABIs, use those
  if (copyExistingABIs()) {
    console.log('Using existing compiled ABIs (contracts not freshly compiled)');
    return;
  }
  
  // As a last resort, create mock ABIs for development without Forge
  createMockABIs();
  console.log('\n⚠️ WARNING: Using mock ABIs for development only!\n');
  console.log('To compile the real contracts, please install Foundry:');
  console.log('- Linux/Mac: curl -L https://foundry.paradigm.xyz | bash');
  console.log('- Then run: foundryup');
  console.log('- Windows: See https://book.getfoundry.sh/getting-started/installation');
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { 
  compileWithForge, 
  compileWithWslBash, 
  copyExistingABIs, 
  createMockABIs,
  ensureChainlinkDependency 
};
