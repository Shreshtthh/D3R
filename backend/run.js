/**
 * Server runner with proper path resolution
 */
require('./fix-paths');

try {
  // Attempt to run the server
  require('./server.js');
} catch (error) {
  console.error('Failed to start server:', error);
  
  // Check common issues
  if (error.code === 'MODULE_NOT_FOUND') {
    const missingModule = error.message.match(/Cannot find module '([^']+)'/);
    if (missingModule && missingModule[1]) {
      console.error(`\nMissing module: ${missingModule[1]}`);
      console.error('\nPossible fixes:');
      console.error('1. Install missing dependency: npm install ' + missingModule[1]);
      console.error('2. Check if path is correct in requires/imports');
      console.error('3. Verify the module exists in node_modules');
    }
  }
  
  process.exit(1);
}
