/**
 * Simple DApp Configuration Check
 * This script checks your basic configuration without external dependencies
 */
const fs = require('fs');
const path = require('path');

// Base directory
const baseDir = path.resolve(__dirname, '..');
console.log('Checking DApp configuration from:', baseDir);

// Check .env file
console.log('\nChecking .env file...');
const envPath = path.join(baseDir, '.env');
if (fs.existsSync(envPath)) {
  console.log('✓ .env file exists');
  
  try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const requiredVars = [
      'RPC_URL',
      'CONTRACT_ADDRESS',
      'BACKEND_URL',
      'PORT',
      'PINATA_API_KEY',
      'PINATA_SECRET_KEY'
    ];
    
    const missingVars = [];
    requiredVars.forEach(variable => {
      if (!envContent.includes(`${variable}=`)) {
        missingVars.push(variable);
      }
    });
    
    if (missingVars.length > 0) {
      console.log(`✗ Missing environment variables: ${missingVars.join(', ')}`);
    } else {
      console.log('✓ All required environment variables found');
    }
  } catch (error) {
    console.log(`✗ Error reading .env file: ${error.message}`);
  }
} else {
  console.log('✗ .env file does not exist');
}

// Check directory structure
console.log('\nChecking directory structure...');
const requiredDirs = ['backend', 'frontend', 'scripts'];
const missingDirs = [];

requiredDirs.forEach(dir => {
  const dirPath = path.join(baseDir, dir);
  if (!fs.existsSync(dirPath) || !fs.statSync(dirPath).isDirectory()) {
    missingDirs.push(dir);
  }
});

if (missingDirs.length > 0) {
  console.log(`✗ Missing required directories: ${missingDirs.join(', ')}`);
} else {
  console.log('✓ All required directories exist');
}

// Check critical files
console.log('\nChecking critical files...');
const requiredFiles = [
  ['backend/server.js', 'Backend server'],
  ['backend/upload.js', 'IPFS upload module'],
  ['frontend/utils/web3.js', 'Web3 utilities'],
  ['frontend/pages/index.js', 'Frontend entry page']
];

const missingFiles = [];
requiredFiles.forEach(([filePath, description]) => {
  const fullPath = path.join(baseDir, filePath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    missingFiles.push(`${filePath} (${description})`);
  }
});

if (missingFiles.length > 0) {
  console.log(`✗ Missing critical files: ${missingFiles.join(', ')}`);
} else {
  console.log('✓ All critical files exist');
}

// Check package.json for appropriate dependencies
console.log('\nChecking package.json files...');
const packageFiles = [
  path.join(baseDir, 'package.json'),
  path.join(baseDir, 'frontend/package.json'),
  path.join(baseDir, 'backend/package.json')
];

packageFiles.forEach(packagePath => {
  if (fs.existsSync(packagePath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      console.log(`✓ Found package.json at ${path.relative(baseDir, packagePath)}`);
      
      const deps = { 
        ...packageJson.dependencies, 
        ...packageJson.devDependencies 
      };
      
      // Check for common dependencies
      if (packagePath.includes('frontend')) {
        const frontendDeps = ['next', 'react', 'web3', 'ethers'];
        const missingFrontendDeps = frontendDeps.filter(dep => !deps[dep]);
        
        if (missingFrontendDeps.length > 0) {
          console.log(`  ✗ Missing frontend dependencies: ${missingFrontendDeps.join(', ')}`);
        } else {
          console.log('  ✓ All common frontend dependencies found');
        }
      }
      
      if (packagePath.includes('backend')) {
        const backendDeps = ['express', 'multer', 'dotenv'];
        const missingBackendDeps = backendDeps.filter(dep => !deps[dep]);
        
        if (missingBackendDeps.length > 0) {
          console.log(`  ✗ Missing backend dependencies: ${missingBackendDeps.join(', ')}`);
        } else {
          console.log('  ✓ All common backend dependencies found');
        }
      }
    } catch (error) {
      console.log(`✗ Error parsing package.json at ${path.relative(baseDir, packagePath)}: ${error.message}`);
    }
  } else {
    console.log(`✗ Missing package.json at ${path.relative(baseDir, packagePath)}`);
  }
});

console.log('\nCheck complete!');
console.log('Run backend with: cd backend && node run.js');
console.log('Run frontend with: cd frontend && npm run dev');
