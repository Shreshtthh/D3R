#!/bin/bash

# Simple deployment script that directly uses Foundry's forge command
# Avoids any private key parsing issues by passing it directly

# Check if we have arguments
if [ "$#" -lt 1 ]; then
    echo "Usage: ./deploy-forge.sh PRIVATE_KEY [RPC_URL]"
    echo "Example: ./deploy-forge.sh ccfd5698326b0fa3f65c7928b8d7ce3b64ef1e3e0fee57e0037d596029168ff9"
    exit 1
fi

# Get arguments
PRIVATE_KEY=$1

# Optional RPC URL
if [ "$#" -ge 2 ]; then
    RPC_URL=$2
else
    RPC_URL="https://sepolia.infura.io/v3/ab111591b0a84fb4920f9dfd7f940d27"
fi

# Get gas parameters (optional)
if [ "$#" -ge 3 ]; then
    GAS_PRICE=$3
else
    # Get current gas price and add 20% to ensure faster processing
    echo "Fetching current gas price..."
    BASE_GAS_PRICE=$(cast gas-price --rpc-url "$RPC_URL" 2>/dev/null || echo "0")
    
    if [ "$BASE_GAS_PRICE" != "0" ]; then
        # Add 20% to the current gas price
        GAS_PRICE=$(echo "$BASE_GAS_PRICE * 1.2" | bc | cut -d '.' -f 1)
        echo "Setting gas price to $GAS_PRICE wei (current + 20%)"
    else
        # If we couldn't get the gas price, use a reasonable default for Sepolia
        GAS_PRICE="3000000000"  # 3 gwei
        echo "Using default gas price of 3 gwei"
    fi
fi

echo "=== D3R Protocol Deployment ==="
echo "Using RPC URL: $RPC_URL"

# Show abbreviated private key for confirmation
PK_ABBREV="${PRIVATE_KEY:0:6}...${PRIVATE_KEY: -4}"
echo "Using private key: $PK_ABBREV"

# Add gas price parameter if we have it
GAS_PARAMS=""
if [ ! -z "$GAS_PRICE" ]; then
    GAS_PARAMS="--gas-price $GAS_PRICE"
    echo "Using gas price: $GAS_PRICE wei"
fi

# Execute forge script directly with the provided private key
forge script script/Deploy.s.sol:DeployScript \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    $GAS_PARAMS \
    --broadcast

DEPLOY_RESULT=$?

if [ $DEPLOY_RESULT -eq 0 ]; then
    echo "✅ Deployment transactions submitted!"
    echo "Monitoring transactions for confirmation..."
    
    # Execute the transaction monitoring script if it exists
    if [ -f "script/monitor-txs.sh" ]; then
        chmod +x script/monitor-txs.sh
        ./script/monitor-txs.sh
    else
        echo "Transaction monitoring script not found. Check transactions manually."
    fi
    
    # Find and extract contract addresses
    LATEST_LOG=$(find broadcast -name "run-latest.json" | sort -r | head -1)
    if [ ! -z "$LATEST_LOG" ]; then
        grep -A 10 "=== Contract Addresses ===" "$LATEST_LOG" > deployment_addresses.txt
        cat deployment_addresses.txt
        echo "Contract addresses saved to deployment_addresses.txt"
    fi
else
    echo "❌ Deployment failed!"
    exit 1
fi
