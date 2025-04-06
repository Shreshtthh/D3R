#!/bin/bash

# Extremely simplified deployment script for D3R Protocol
# This script uses the most basic working command format for Foundry

set -e  # Exit on error

# Load environment variables
if [ -f .env ]; then
    source .env
    echo "Environment loaded from .env file"
else
    echo "Error: .env file not found!"
    exit 1
fi

# Support both RPC_URL and SEPOLIA_RPC_URL
if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
    RPC_URL=$SEPOLIA_RPC_URL
    echo "Using SEPOLIA_RPC_URL as RPC endpoint"
fi

# Support both ORACLE_ADDRESS and CHAINLINK_ORACLE_ADDRESS
if [ -z "$ORACLE_ADDRESS" ] && [ ! -z "$CHAINLINK_ORACLE_ADDRESS" ]; then
    export ORACLE_ADDRESS=$CHAINLINK_ORACLE_ADDRESS
    echo "Using CHAINLINK_ORACLE_ADDRESS for ORACLE_ADDRESS"
fi

# Support both JOB_ID and CHAINLINK_JOB_ID
if [ -z "$JOB_ID" ] && [ ! -z "$CHAINLINK_JOB_ID" ]; then
    export JOB_ID=$CHAINLINK_JOB_ID
    echo "Using CHAINLINK_JOB_ID for JOB_ID"
fi

# Support both ORACLE_FEE and CHAINLINK_FEE
if [ -z "$ORACLE_FEE" ] && [ ! -z "$CHAINLINK_FEE" ]; then
    export ORACLE_FEE=$CHAINLINK_FEE
    echo "Using CHAINLINK_FEE for ORACLE_FEE"
fi

# Check required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not set"
    exit 1
fi

echo "================================================="
echo "D3R Protocol Deployment - Simple Command Version"
echo "================================================="
echo "Using RPC URL: $RPC_URL"

# Display wallet address if cast is working
DEPLOYER=$(cast wallet address $PRIVATE_KEY 2>/dev/null) 
if [ $? -eq 0 ]; then
    echo "Deployer address: $DEPLOYER"
else 
    echo "Deployer address: Unable to determine (cast not working)"
fi

echo "Compiling contracts..."
forge build

echo "Deploying contracts..."

if [ "$1" == "--verify" ]; then
    if [ -z "$ETHERSCAN_API_KEY" ]; then
        echo "Error: --verify flag used but ETHERSCAN_API_KEY not set"
        exit 1
    fi
    
    echo "Deploying with contract verification..."
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url "$RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --broadcast \
        --verify \
        --etherscan-api-key "$ETHERSCAN_API_KEY"
else
    # Use the most basic syntax - recent Foundry versions require this ordering
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url "$RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --broadcast
fi

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "✅ Deployment successful!"
    
    # Find and show the contract addresses
    LATEST_LOG=$(find broadcast -name "run-latest.json" | sort -r | head -1)
    if [ ! -z "$LATEST_LOG" ]; then
        echo "Contract addresses from deployment:"
        grep -A 10 "=== Contract Addresses ===" "$LATEST_LOG" | tee deployment_addresses.txt
        echo "Addresses saved to deployment_addresses.txt"
    else
        echo "No deployment log found."
    fi
else
    echo "❌ Deployment failed!"
    
    # Provide diagnostic information
    echo -e "\nPossible fixes:"
    echo "1. Check that all contract imports use the correct paths"
    echo "2. Make sure you have sufficient funds in your wallet for deployment"
    echo "3. Verify your RPC_URL is correct and the network is operational"
fi

exit $RESULT
