#!/bin/bash

# Script to help set up environment variables directly from command line
# This helps avoid issues with .env file loading

echo "================================================"
echo "D3R Protocol Environment Variable Setup"
echo "================================================"

# Check if parameters are provided
if [ "$#" -lt 1 ]; then
    echo "Usage: ./setup-env.sh PRIVATE_KEY [RPC_URL]"
    echo "Example: ./setup-env.sh abcdef1234567890 https://sepolia.infura.io/v3/YOUR_API_KEY"
    exit 1
fi

# Extract parameters
PRIVATE_KEY="$1"
RPC_URL="${2:-https://sepolia.infura.io/v3/ab111591b0a84fb4920f9dfd7f940d27}"

# Remove any 0x prefix from private key if present
PRIVATE_KEY="${PRIVATE_KEY#0x}"

# Check private key format
if ! [[ $PRIVATE_KEY =~ ^[0-9a-fA-F]{64}$ ]]; then
    echo "Error: Private key must be a 64-character hex string"
    echo "Current key length: ${#PRIVATE_KEY} characters"
    exit 1
fi

# Export the variables
export PRIVATE_KEY="$PRIVATE_KEY"
export RPC_URL="$RPC_URL"
export LINK_TOKEN_ADDRESS="0x779877A7B0D9E8603169DdbD7836e478b4624789"
export ORACLE_ADDRESS="0x40193c8518BB267228Fc409a613bDbD8eC5a97b3"
export JOB_ID="7d80a6386ef543a3abb52817f6707e3b"
export ORACLE_FEE="100000000000000000"

# Display configuration
echo "Environment variables set:"
echo "PRIVATE_KEY: ${PRIVATE_KEY:0:6}...${PRIVATE_KEY:(-4)}" # Show only beginning and end for security
echo "RPC_URL: $RPC_URL"
echo "LINK_TOKEN_ADDRESS: $LINK_TOKEN_ADDRESS"
echo "ORACLE_ADDRESS: $ORACLE_ADDRESS"
echo "JOB_ID: $JOB_ID"
echo "ORACLE_FEE: $ORACLE_FEE"

echo ""
echo "Now run your deployment with:"
echo "forge script script/Deploy.s.sol:DeployScript --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast"
echo ""
echo "Or simply run:"
echo "./script/direct-deploy.sh"
