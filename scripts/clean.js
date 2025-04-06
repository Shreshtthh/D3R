const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Log with time
function log(message) {
  console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
}

// Function to safely remove files or directories
function safeRemove(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        log(`Removing directory: ${filePath}`);
        fs.rmSync(filePath, { recursive: true, force: true });
      } else {
        log(`Removing file: ${filePath}`);
        fs.unlinkSync(filePath);
      }
      return true;
    }
  } catch (error) {
    console.error(`Error removing ${filePath}:`, error.message);
    return false;
  }
  return false;
}

// Get the root directory - handle WSL path conversions
const rootDir = path.resolve(__dirname, '..');
const frontendDir = path.join(rootDir, 'frontend');

// Start the cleaning
log('Cleaning D3R Platform build artifacts...');
log(`Working directory: ${rootDir}`);

// Clean frontend directory
log('Cleaning frontend directory...');
safeRemove(path.join(frontendDir, '.babelrc'));
safeRemove(path.join(frontendDir, 'node_modules'));
safeRemove(path.join(frontendDir, '.next'));

// Clean root node_modules
log('Cleaning root node_modules...');
safeRemove(path.join(rootDir, 'node_modules'));

log('Cleaning complete! Now run "npm run setup" to reinstall dependencies.');
