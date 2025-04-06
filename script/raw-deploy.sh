#!/bin/bash

# Ultra-simple deployment script using direct command execution
# This avoids any internal parsing issues with private keys

# Check if we have a private key argument
if [ "$#" -lt 1 ]; then
    if [ -f .env ]; then
        source .env
        echo "Using private key from .env file"
    else
        echo "Error: No private key provided and no .env file found"
        echo "Usage: ./raw-deploy.sh PRIVATE_KEY [RPC_URL]"
        exit 1
    fi
else
    # Use command line argument
    PRIVATE_KEY="$1"
    echo "Using private key from command line argument"
fi

# Check for RPC URL
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

# Remove 0x prefix if present
if [[ $PRIVATE_KEY == 0x* ]]; then
    PRIVATE_KEY="${PRIVATE_KEY#0x}"
    echo "Removed 0x prefix from private key"
fi

echo "Deploying contracts to: $RPC_URL"

# Run the forge command directly
echo "Executing forge script..."
forge script script/Deploy.s.sol:DeployScript --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast

RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "✅ Deployment successful!"
    
    # Find and show contract addresses
    LATEST_LOG=$(find broadcast -name "run-latest.json" | sort -r | head -1)
    if [ ! -z "$LATEST_LOG" ]; then
        echo "Contract addresses from deployment:"
        grep -A 10 "=== Contract Addresses ===" "$LATEST_LOG" | tee deployment_addresses.txt
        echo "Addresses saved to deployment_addresses.txt"
    fi
else
    echo "❌ Deployment failed!"
fi

exit $RESULT
