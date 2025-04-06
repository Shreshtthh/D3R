#!/bin/bash

# A simplified deployment script that avoids fork-url issues
# This script uses direct foundry commands with reordered parameters

# Load environment variables
source .env

echo "Starting deployment with direct command format..."

# Run deployment with reordered parameters to avoid fork-url error
forge script \
    --rpc-url $RPC_URL \
    script/Deploy.s.sol:DeployScript \
    --private-key $PRIVATE_KEY \
    --broadcast

# Check result
if [ $? -eq 0 ]; then
    echo "Deployment successful!"
    exit 0
else
    echo "Deployment failed. See error messages above."
    exit 1
fi
