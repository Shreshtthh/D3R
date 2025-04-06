# DApp Testing Plan

## Prerequisites
- MetaMask extension installed in your browser
- Test ETH in your MetaMask wallet
- Backend server running
- Frontend development server running

## Step 1: Start the Backend Server
```bash
# In WSL/Linux
cd /mnt/c/Program\ Files/blockchain-d3r/backend
node run.js

# In Windows Command Prompt
cd "C:\Program Files\blockchain-d3r\backend"
node run.js
```

## Step 2: Start the Frontend Development Server
```bash
# In WSL/Linux
cd /mnt/c/Program\ Files/blockchain-d3r/frontend
npm run dev

# In Windows Command Prompt
cd "C:\Program Files\blockchain-d3r\frontend"
npm run dev
```

## Step 3: Run the Test Checklist
1. Open your browser and navigate to: http://localhost:3000/test-checklist
2. Verify that automated tests pass successfully:
   - Web3 Connection
   - MetaMask Installation
   - Account Connection
   - Smart Contract Availability
   - Backend API Availability
   - IPFS Service Availability

3. Manually test and mark each feature:
   - Forms Working: Test input validation and submission
   - Donations Working: Make a small test donation
   - Milestones Working: Submit a milestone with proof
   - NGO Registration: Register a test NGO

4. Generate a test report to document the current state

## Step 4: Verify Individual Features

### Donor Dashboard
- Connect wallet
- View available projects
- Make a small donation
- Verify transaction confirmation
- Check if donation reflects in the project fund

### NGO Registration
- Fill the registration form
- Submit NGO documentation
- Verify proper registration in the blockchain
- Check that the NGO appears in the system

### Milestone Submission
- Select one of your projects
- Create a milestone with description
- Upload proof documentation
- Submit the milestone
- Verify it appears in the milestone list

### Connection Checks
- Verify Web3 status on the homepage
- Use the connection check page to debug issues
- Use the API check page to verify service availability

## Troubleshooting Common Issues

### Web3 Connection Issues
- Make sure MetaMask is installed and unlocked
- Check if you're connected to the correct network
- Verify your wallet has enough test ETH for transactions

### Backend Connection Issues
- Verify the backend server is running (http://localhost:3000)
- Check backend terminal for error logs
- Ensure your .env file has correct configuration

### IPFS Issues
- Verify your Pinata API keys in .env file
- Check the backend logs for IPFS connection errors

### Smart Contract Issues
- Ensure contract address in .env is correct
- Verify you're using the correct network
- Check if contract ABI matches deployed contract
