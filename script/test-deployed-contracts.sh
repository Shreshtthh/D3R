#!/bin/bash

# Script to test interactions with deployed contracts
# This script runs through basic interaction tests with the deployed contracts

# Load environment
if [ -f .env ]; then
    source .env
fi

# Check if deployment addresses file exists
if [ ! -f "deployment_addresses.txt" ]; then
    echo "Error: deployment_addresses.txt not found"
    echo "Run a deployment first or specify contract addresses manually"
    exit 1
fi

# Extract contract addresses
echo "Loading contract addresses..."
NGO_REGISTRY=$(grep "ngoRegistry:" deployment_addresses.txt | awk '{print $2}')
FUND_POOL=$(grep "fundPool:" deployment_addresses.txt | awk '{print $2}')
DONATION_TRACKER=$(grep "donationTracker:" deployment_addresses.txt | awk '{print $2}')
MILESTONE_FUNDING=$(grep "milestoneFunding:" deployment_addresses.txt | awk '{print $2}')
IPFS_VERIFIER=$(grep "ipfsVerifier:" deployment_addresses.txt | awk '{print $2}')
DISASTER_ORACLE=$(grep "disasterOracle:" deployment_addresses.txt | awk '{print $2}')
D3R_PROTOCOL=$(grep "d3rProtocol:" deployment_addresses.txt | awk '{print $2}')

# Check private key
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set"
    exit 1
fi

# Check RPC URL
if [ -z "$RPC_URL" ]; then
    if [ ! -z "$SEPOLIA_RPC_URL" ]; then
        RPC_URL=$SEPOLIA_RPC_URL
    else
        echo "Error: RPC_URL not set"
        exit 1
    fi
fi

# Get user wallet address
WALLET=$(cast wallet address --private-key $PRIVATE_KEY)
echo "Using wallet address: $WALLET"
echo "Testing deployed contracts on network: $RPC_URL"
echo "-----------------------------------------"

# Test 1: Register as NGO
echo "Test 1: Registering $WALLET as an NGO..."
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $NGO_REGISTRY "registerNGO(string,string,string)" "Test NGO" "https://testdomain.org" "test@ngo.org"

if [ $? -eq 0 ]; then
    echo "✅ Successfully registered as NGO"
    
    # Check NGO details
    echo "Checking NGO details..."
    NGO_INFO=$(cast call --rpc-url $RPC_URL $NGO_REGISTRY "getNGODetails(address)" $WALLET)
    echo "NGO Info: $NGO_INFO"
else
    echo "❌ Failed to register as NGO"
fi

# Test 2: Verify the NGO
echo "-----------------------------------------"
echo "Test 2: Verifying NGO..."
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $NGO_REGISTRY "verifyNGO(address,bool)" $WALLET true

if [ $? -eq 0 ]; then
    echo "✅ Successfully verified NGO"
    
    # Check verified status
    IS_VERIFIED=$(cast call --rpc-url $RPC_URL $NGO_REGISTRY "isVerified(address)" $WALLET)
    echo "Verification status: $IS_VERIFIED"
else
    echo "❌ Failed to verify NGO"
fi

# Test 3: Make a donation
echo "-----------------------------------------"
echo "Test 3: Making a donation to NGO..."
DONATION_AMOUNT="10000000000000000" # 0.01 ETH
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $FUND_POOL "donate(address)" $WALLET --value $DONATION_AMOUNT

if [ $? -eq 0 ]; then
    echo "✅ Successfully made donation"
    
    # Get total funds
    FUND_COUNT=$(cast call --rpc-url $RPC_URL $FUND_POOL "fundCount()(uint256)")
    echo "Fund count: $FUND_COUNT"
    FUND_DETAILS=$(cast call --rpc-url $RPC_URL $FUND_POOL "getFundDetails(uint256)(address,uint256,uint256,bool,uint256)" $FUND_COUNT)
    echo "Fund details: $FUND_DETAILS"
else
    echo "❌ Failed to make donation"
fi

# Test 4: Add milestone to the fund
echo "-----------------------------------------"
echo "Test 4: Adding milestone to fund..."
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $FUND_POOL "addMilestone(uint256,string,uint256)" $FUND_COUNT "First Milestone" "5000000000000000"

if [ $? -eq 0 ]; then
    echo "✅ Successfully added milestone"
    
    # Get milestone details
    MILESTONE_DETAILS=$(cast call --rpc-url $RPC_URL $FUND_POOL "getMilestone(uint256,uint256)(string,uint256,bool)" $FUND_COUNT 0)
    echo "Milestone details: $MILESTONE_DETAILS"
else
    echo "❌ Failed to add milestone"
fi

# Test 5: Submit report for milestone
echo "-----------------------------------------"
echo "Test 5: Submitting report for milestone..."
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $DONATION_TRACKER "submitReport(uint256,uint256,string,string)" $FUND_COUNT 0 "Progress report for milestone" "QmTest123456"

if [ $? -eq 0 ]; then
    echo "✅ Successfully submitted report"
    
    # Get report details
    REPORT_DETAILS=$(cast call --rpc-url $RPC_URL $DONATION_TRACKER "getReportDetails(uint256,uint256)(string,string,bool)" $FUND_COUNT 0)
    echo "Report details: $REPORT_DETAILS"
else
    echo "❌ Failed to submit report"
fi

# Test 6: Approve report
echo "-----------------------------------------"
echo "Test 6: Approving report..."
cast send --rpc-url $RPC_URL --private-key $PRIVATE_KEY $DONATION_TRACKER "approveReport(uint256,uint256)" $FUND_COUNT 0

if [ $? -eq 0 ]; then
    echo "✅ Successfully approved report"
    
    # Check if funds were released
    UPDATED_FUND=$(cast call --rpc-url $RPC_URL $FUND_POOL "getFundDetails(uint256)(address,uint256,uint256,bool,uint256)" $FUND_COUNT)
    echo "Updated fund details: $UPDATED_FUND"
else
    echo "❌ Failed to approve report"
fi

echo "-----------------------------------------"
echo "Testing complete!"
echo "You can now interact with your contracts at these addresses:"
echo "- NGO Registry: $NGO_REGISTRY"
echo "- Fund Pool: $FUND_POOL" 
echo "- Donation Tracker: $DONATION_TRACKER"
echo "- Milestone Funding: $MILESTONE_FUNDING"
echo "- IPFS Verifier: $IPFS_VERIFIER"
echo "- Disaster Oracle: $DISASTER_ORACLE"
echo "- D3R Protocol: $D3R_PROTOCOL"
