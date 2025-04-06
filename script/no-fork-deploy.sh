#!/bin/bash

# Force no-fork deployment script for D3R Protocol
# Updated to use correct Foundry command format

set -e # Exit on error

echo "================================="
echo "D3R Protocol Deployment"
echo "================================="

# Check if .env file exists and load it
if [ -f .env ]; then
    source .env
    echo "Environment loaded from .env file"
else
    echo "Warning: No .env file found, using environment variables directly"
fi

# Support both RPC_URL and SEPOLIA_RPC_URL (check .env file)
if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
    RPC_URL=$SEPOLIA_RPC_URL
    echo "Using SEPOLIA_RPC_URL as RPC endpoint"
fi

# Validate required environment variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set in .env file"
    echo "Please add PRIVATE_KEY=your_private_key to .env"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: No RPC URL found. Neither RPC_URL nor SEPOLIA_RPC_URL is set in .env file"
    echo "Please add RPC_URL=your_rpc_url to .env"
    exit 1
fi

echo "Deployer address: $(cast wallet address $PRIVATE_KEY 2>/dev/null || echo 'Unable to get address - cast not working')"
echo "Using RPC URL: $RPC_URL"

echo "Compiling contracts..."
forge build

echo "Deploying contracts..."

# Direct deployment with correct parameter order
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
    echo "Deploying without verification..."
    forge script script/Deploy.s.sol:DeployScript \
        --rpc-url "$RPC_URL" \
        --private-key "$PRIVATE_KEY" \
        --broadcast
fi

DEPLOYMENT_RESULT=$?

if [ $DEPLOYMENT_RESULT -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    
    # Find and extract contract addresses
    LATEST_RUN=$(find broadcast -name "run-latest.json" | sort -r | head -1)
    if [ ! -z "$LATEST_RUN" ]; then
        echo "Extracting contract addresses..."
        grep -A 10 "=== Contract Addresses ===" "$LATEST_RUN" > deployment_addresses.txt
        cat deployment_addresses.txt
        echo "Addresses saved to deployment_addresses.txt"
    fi
else
    echo "❌ Deployment failed!"
    
    # Provide helpful error information
    echo ""
    echo "Troubleshooting steps:"
    echo "1. Make sure your RPC_URL ($RPC_URL) is correct and accessible"
    echo "2. Ensure your PRIVATE_KEY has enough funds for gas"
    echo "3. Try updating Foundry with 'foundryup'"
    echo "4. Try running the command directly:"
    echo "   forge script script/Deploy.s.sol:DeployScript --rpc-url \"$RPC_URL\" --private-key \"$PRIVATE_KEY\" --broadcast"
    echo ""
    
    exit 1
fi

exit 0
