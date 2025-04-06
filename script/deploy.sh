#!/bin/bash

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create it with the required environment variables."
    echo "See DeploymentInstructions.md for details."
    exit 1
fi

# Load environment variables
source .env

# Validate required variables
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY is not set in .env file."
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL is not set in .env file."
    exit 1
fi

# Check if we should verify contracts
VERIFY_FLAG=""
if [ ! -z "$ETHERSCAN_API_KEY" ] && [ "$1" == "--verify" ]; then
    VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
    echo "Will verify contracts using Etherscan API key"
fi

echo "Starting deployment to network: $RPC_URL"
echo "Using deployer address: $(cast wallet address $PRIVATE_KEY)"

# Run the deployment script
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast \
    $VERIFY_FLAG

# Check if deployment was successful
if [ $? -ne 0 ]; then
    echo "Deployment failed. Please check the error messages above."
    exit 1
fi

echo "Deployment completed successfully!"

# Save contract addresses for later use
if [ -f "broadcast/Deploy.s.sol/*/run-latest.json" ]; then
    echo "Extracting contract addresses from deployment logs..."
    grep -A 12 "=== Contract Addresses ===" $(ls -t broadcast/Deploy.s.sol/*/run-latest.json | head -1) > deployment_addresses.txt
    echo "Contract addresses saved to deployment_addresses.txt"
fi
