#!/bin/bash

# Script to deploy contracts directly, avoiding environment variable issues

echo "Starting D3R Protocol deployment..."

# Check if we have needed environment variables and set defaults if needed
if [ -z "$PRIVATE_KEY" ]; then
    if [ -f .env ]; then
        source .env
        echo "Loaded environment from .env file"
    else
        echo "Error: No PRIVATE_KEY found in environment and no .env file exists"
        echo "Please run: export PRIVATE_KEY=your_private_key_here"
        exit 1
    fi
fi

# Check for private key and RPC URL
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set. Please set it directly or in .env file"
    exit 1
fi

# If RPC_URL not set but SEPOLIA_RPC_URL is available, use that
if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
    export RPC_URL="$SEPOLIA_RPC_URL"
    echo "Using SEPOLIA_RPC_URL for deployment"
fi

# Final check for RPC URL
if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not set. Please set it directly or in .env file"
    exit 1
fi

# Remove 0x prefix if present in private key
if [[ $PRIVATE_KEY == 0x* ]]; then
    PRIVATE_KEY="${PRIVATE_KEY#0x}"
    echo "Removed 0x prefix from private key"
fi

# Check private key format
if ! [[ $PRIVATE_KEY =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo "Warning: Private key should be a 64-character hex string without 0x prefix"
    echo "Current key length: ${#PRIVATE_KEY} characters"
fi

# Check if RPC URL is valid
if ! [[ $RPC_URL =~ ^https?:// ]]; then
    echo "Warning: RPC_URL does not appear to be a valid URL"
    echo "Current RPC URL: $RPC_URL"
fi

echo "Deploying contracts to: $RPC_URL"
echo "Using private key: ${PRIVATE_KEY:0:6}...${PRIVATE_KEY:(-4)}" # Show only beginning and end for security

# Deploy using forge
echo "Running forge deployment..."
forge script script/Deploy.s.sol:DeployScript --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo "✅ Deployment Successful!"
    
    # Find and extract contract addresses
    LATEST_LOG=$(find broadcast -name "run-latest.json" | sort -r | head -1)
    if [ ! -z "$LATEST_LOG" ]; then
        echo "Contract addresses from deployment:"
        grep -A 10 "=== Contract Addresses ===" "$LATEST_LOG" | tee deployment_addresses.txt
        echo "Addresses saved to deployment_addresses.txt"
    else
        echo "No deployment log found."
    fi
else
    echo "❌ Deployment Failed!"
    echo "Check the error messages above for details."
fi

exit $DEPLOY_STATUS
