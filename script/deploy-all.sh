#!/bin/bash

# Comprehensive deployment script with transaction management
# This script handles the entire deployment process and helps manage pending transactions

set -e # Exit on error

echo "======================================="
echo "D3R Protocol - Full Deployment Process"
echo "======================================="

# Load environment or arguments
if [ "$#" -lt 1 ]; then
    # No arguments provided, try to load from .env
    if [ -f .env ]; then
        source .env
        echo "Environment loaded from .env file"
    else
        echo "Error: No private key provided and no .env file found"
        echo "Usage: ./deploy-all.sh PRIVATE_KEY [RPC_URL] [GAS_PRICE]"
        exit 1
    fi
else
    # Use command line arguments
    PRIVATE_KEY="$1"
    echo "Using private key from command line argument"
    
    if [ "$#" -ge 2 ]; then
        RPC_URL="$2"
        echo "Using RPC URL from command line argument"
    elif [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
        RPC_URL="$SEPOLIA_RPC_URL"
        echo "Using SEPOLIA_RPC_URL from environment"
    elif [ -z "$RPC_URL" ]; then
        RPC_URL="https://sepolia.infura.io/v3/ab111591b0a84fb4920f9dfd7f940d27"
        echo "Using default Sepolia RPC URL"
    fi
    
    # Optional gas price
    if [ "$#" -ge 3 ]; then
        GAS_PRICE="$3"
        echo "Using custom gas price: $GAS_PRICE wei"
    fi
fi

# Make the speed-up script executable
chmod +x script/speed-up-tx.sh
chmod +x script/check-tx-status.sh
chmod +x script/resolve-pending-txs.sh

# Perform pre-deployment checks
echo ""
echo "Step 1: Pre-deployment checks"
echo "-----------------------------"

# Check for private key and RPC URL
if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set. Please set it directly or in .env file"
    exit 1
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not set. Please set it directly or in .env file"
    exit 1
fi

# Check private key format
if [[ $PRIVATE_KEY == 0x* ]]; then
    PRIVATE_KEY="${PRIVATE_KEY#0x}"
    echo "Removed 0x prefix from private key"
fi

# Show wallet address
DEPLOYER=$(cast wallet address "$PRIVATE_KEY" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Deployer address: $DEPLOYER"
else
    echo "Error: Unable to derive address from private key. Check your private key."
    exit 1
fi

# Check wallet balance
BALANCE=$(cast balance --rpc-url "$RPC_URL" "$DEPLOYER" 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "Wallet balance: $BALANCE ETH"
    
    # Convert to wei for comparison
    BALANCE_WEI=$(cast --to-wei "$BALANCE" 2>/dev/null)
    MIN_BALANCE_WEI=10000000000000000 # 0.01 ETH
    
    if (( BALANCE_WEI < MIN_BALANCE_WEI )); then
        echo "⚠️ Warning: Low wallet balance. You may not have enough funds for deployment."
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Deployment cancelled."
            exit 1
        fi
    fi
else
    echo "Warning: Unable to check wallet balance. Will proceed anyway."
fi

# Compile contracts
echo ""
echo "Step 2: Compiling contracts"
echo "--------------------------"
forge build
if [ $? -ne 0 ]; then
    echo "Error: Contract compilation failed."
    exit 1
fi
echo "✅ Contracts compiled successfully"

# Deploy contracts
echo ""
echo "Step 3: Deploying contracts"
echo "-------------------------"

# Set up gas price params
GAS_PARAMS=""
if [ ! -z "$GAS_PRICE" ]; then
    GAS_PARAMS="--gas-price $GAS_PRICE"
fi

# Record start time
START_TIME=$(date +%s)

# Run the deployment
echo "Starting deployment at $(date)"
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --broadcast \
    $GAS_PARAMS

DEPLOY_STATUS=$?

if [ $DEPLOY_STATUS -ne 0 ]; then
    echo "❌ Deployment failed. Check the error messages above."
    exit 1
fi

# Find the latest broadcast file
LATEST_BROADCAST=$(find broadcast -name "run-latest.json" | sort -r | head -1)

if [ -z "$LATEST_BROADCAST" ]; then
    echo "Warning: No broadcast file found. Cannot extract transaction data."
else
    # Extract and display deployed contract addresses
    echo ""
    echo "Step 4: Extracting contract addresses"
    echo "----------------------------------"
    grep -A 10 "=== Contract Addresses ===" "$LATEST_BROADCAST" > deployment_addresses.txt
    cat deployment_addresses.txt
    echo ""
    echo "Contract addresses saved to deployment_addresses.txt"
fi

# Monitor transaction status
echo ""
echo "Step 5: Monitoring transaction status"
echo "----------------------------------"
./script/resolve-pending-txs.sh

# Calculate and display deployment time
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

echo ""
echo "✅ Deployment process completed in ${MINUTES}m ${SECONDS}s"
echo ""
echo "If some transactions are still pending, you can:"
echo "1. Wait longer for them to confirm"
echo "2. Run './script/resolve-pending-txs.sh' to check status"
echo "3. Use './script/speed-up-tx.sh <TX_HASH> 2.0' to speed up specific transactions"
