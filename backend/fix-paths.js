/**
 * This helper ensures proper module resolution for the server
 */
const path = require('path');
const fs = require('fs');

// Check if we're in the correct directory
const serverPath = path.join(__dirname, 'server.js');
if (!fs.existsSync(serverPath)) {
  console.error('ERROR: server.js not found in current directory');
  console.error('Make sure to run this from the backend directory');
  process.exit(1);
}

// Set up proper paths for module resolution
module.paths.push(path.join(__dirname, '..'));
module.paths.push(path.join(__dirname, '../node_modules'));

// Check for required files
const requiredFiles = [
  'upload.js',
  '../.env',
  '../config/contracts.js'
];

const missingFiles = requiredFiles.filter(file => !fs.existsSync(path.join(__dirname, file)));
if (missingFiles.length > 0) {
  console.error('WARNING: Some required files are missing:');
  missingFiles.forEach(file => console.error(`- ${file}`));
}

// Create directories if needed
const dirs = [
  'uploads',
  '../config'
];

dirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Export the modified paths
module.exports = {
  rootDir: path.join(__dirname, '..'),
  configDir: path.join(__dirname, '../config'),
  uploadsDir: path.join(__dirname, 'uploads')
};
