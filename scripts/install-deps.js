#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing Forge dependencies...');

// Define dependencies to install
const dependencies = [
  { name: 'openzeppelin-contracts', repo: 'OpenZeppelin/openzeppelin-contracts', version: 'v5.0.1' },
  { name: 'chainlink', repo: 'smartcontractkit/chainlink', version: 'v2.8.0' },
  { name: 'forge-std', repo: 'foundry-rs/forge-std', version: 'v1.7.5' }
];

// Create lib directory if it doesn't exist
const libDir = path.join(__dirname, '..', 'lib');
if (!fs.existsSync(libDir)) {
  fs.mkdirSync(libDir, { recursive: true });
}

// Install each dependency
dependencies.forEach(dep => {
  try {
    // Check if dependency already exists
    const depPath = path.join(libDir, dep.name);
    if (fs.existsSync(depPath)) {
      console.log(`${dep.name} already installed. Updating...`);
      execSync(`cd ${depPath} && git fetch && git checkout ${dep.version}`, { stdio: 'inherit' });
    } else {
      console.log(`Installing ${dep.name}...`);
      execSync(`forge install ${dep.repo}@${dep.version} --no-commit`, { stdio: 'inherit' });
    }
  } catch (error) {
    console.error(`Error installing ${dep.name}:`, error.message);
  }
});

console.log('Creating remappings.txt file...');
const remappings = [
  '@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/',
  '@chainlink/contracts/=lib/chainlink/contracts/',
  'forge-std/=lib/forge-std/src/'
];

fs.writeFileSync(
  path.join(__dirname, '..', 'remappings.txt'),
  remappings.join('\n') + '\n'
);

console.log('Dependencies installed successfully!');
