# Running Integration Tests for D3R Protocol

This guide explains how to run integration tests against your deployed contract infrastructure.

## Prerequisites

1. Deployed contracts (via `deploy-all.sh` script)
2. ETH in your wallet for test transactions 
3. The `cast` command line tool (part of Foundry)

## Basic Integration Test

After your contracts are deployed, run the following test script:

```bash
# Make the script executable
chmod +x script/test-deployed-contracts.sh

# Run the integration test
./script/test-deployed-contracts.sh
```

This script performs the following tests:

1. Register your wallet as an NGO
2. Verify the NGO (using your owner account)
3. Make a donation to the NGO
4. Add a milestone to the fund
5. Submit a progress report for the milestone
6. Approve the report to release funds

## Manual Testing Commands

If you prefer to run tests manually, here are the commands:

### 1. Register as NGO

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $NGO_REGISTRY "registerNGO(string,string,string)" "Test NGO" "https://testdomain.org" "test@ngo.org"
```

### 2. Verify NGO

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $NGO_REGISTRY "verifyNGO(address,bool)" $YOUR_ADDRESS true
```

### 3. Make a Donation

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $FUND_POOL "donate(address)" $NGO_ADDRESS --value 10000000000000000
```

### 4. Add a Milestone

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $FUND_POOL "addMilestone(uint256,string,uint256)" $FUND_ID "First Milestone" 5000000000000000
```

### 5. Submit Report

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $DONATION_TRACKER "submitReport(uint256,uint256,string,string)" $FUND_ID 0 "Progress report" "QmTest123456"
```

### 6. Approve Report

```bash
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $DONATION_TRACKER "approveReport(uint256,uint256)" $FUND_ID 0
```

## Chainlink Integration Testing

To test Chainlink integrations:

```bash
# Request disaster verification
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $DISASTER_ORACLE "requestDisasterVerification(string,string,string,string)" "disaster-123" "New York, USA" "hurricane" "2025-04-01"
```

Note: This requires the contract to have LINK tokens. You can fund it with:

```bash
# Transfer LINK to the contract
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $LINK_TOKEN_ADDRESS "transfer(address,uint256)" $DISASTER_ORACLE 1000000000000000000
```

## Special Integration Tests

For more advanced testing scenarios:

### Create a Multi-Milestone Project

```bash
# First create a project with funds
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $MILESTONE_FUNDING "createProject(address,string,string)" $NGO_ADDRESS "Disaster Relief Project" "Hurricane recovery" --value 50000000000000000

# Get the project ID
PROJECT_ID=$(cast call --rpc-url $RPC_URL $MILESTONE_FUNDING "projectCount()(uint256)" | cast --to-dec)

# Add milestones
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $MILESTONE_FUNDING "addMilestone(uint256,string,string,uint256)" $PROJECT_ID "Initial Assessment" "documentation" 30
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $MILESTONE_FUNDING "addMilestone(uint256,string,string,uint256)" $PROJECT_ID "Emergency Response" "geo-tagged" 40
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $MILESTONE_FUNDING "addMilestone(uint256,string,string,uint256)" $PROJECT_ID "Recovery Phase" "audit" 30
```

## Troubleshooting

If you encounter issues:

1. Check that your wallet has enough ETH for transactions
2. Ensure you're using the correct contract addresses
3. Verify that your NGO is properly registered and verified before testing donation flows
4. For Chainlink integrations, make sure contracts have sufficient LINK tokens
