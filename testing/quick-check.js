/**
 * Quick DApp Check
 * A minimal dependency check for your blockchain donation platform
 */
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');

// Base directory
const baseDir = path.resolve(__dirname, '..');

console.log('Quick DApp Check - Starting...');

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Helper to print colored text
function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    const req = client.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsedData });
          } catch (e) {
            resolve({ statusCode: res.statusCode, data });
          }
        } else {
          reject(new Error(`Request failed with status code ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.end();
  });
}

// Check if a file exists
function checkFile(filePath, description) {
  const fullPath = path.join(baseDir, filePath);
  
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    print('green', `✓ ${description} (${filePath}) exists`);
    return true;
  } else {
    print('red', `✗ ${description} (${filePath}) not found`);
    return false;
  }
}

// Check .env variables
function checkEnvVariables() {
  print('blue', '\nChecking .env file...');
  const envPath = path.join(baseDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    print('red', '✗ .env file missing');
    return false;
  }
  
  print('green', '✓ .env file exists');
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'RPC_URL',
    'CONTRACT_ADDRESS',
    'PINATA_API_KEY',
    'PINATA_SECRET_KEY'
  ];
  
  let allFound = true;
  requiredVars.forEach(variable => {
    if (envContent.includes(`${variable}=`)) {
      const match = envContent.match(new RegExp(`${variable}=(.*)`, 'i'));
      const value = match && match[1] ? match[1].trim() : '';
      
      if (!value || value.includes('your_') || value === '0x123...') {
        print('yellow', `⚠ ${variable} exists but appears to be a placeholder`);
        allFound = false;
      } else {
        print('green', `✓ ${variable} configured`);
      }
    } else {
      print('red', `✗ ${variable} missing`);
      allFound = false;
    }
  });
  
  return allFound;
}

// Run the checks
async function runChecks() {
  print('blue', 'Starting basic DApp checks...');
  
  // Check critical files
  print('blue', '\nChecking critical files...');
  checkFile('backend/server.js', 'Backend server');
  checkFile('backend/upload.js', 'IPFS upload module');
  checkFile('frontend/utils/web3.js', 'Web3 utility');
  checkFile('frontend/pages/index.js', 'Frontend homepage');
  
  // Check environment variables
  const envCheck = checkEnvVariables();
  
  // Check backend is running
  print('blue', '\nChecking if backend server is running...');
  try {
    const backendUrl = 'http://localhost:3000/api/contract-addresses';
    await makeRequest(backendUrl);
    print('green', '✓ Backend server is running');
  } catch (error) {
    print('red', `✗ Backend server check failed: ${error.message}`);
    print('yellow', '  To start the backend server:');
    print('yellow', '  1. Open a new terminal');
    print('yellow', '  2. Navigate to the backend directory:');
    print('yellow', '     cd /mnt/c/Program\\ Files/blockchain-d3r/backend');
    print('yellow', '  3. Run the server:');
    print('yellow', '     node run.js');
  }
  
  print('blue', '\nChecks complete!');
}

// Run the checks
runChecks().catch(error => {
  print('red', `Error running checks: ${error.message}`);
});
