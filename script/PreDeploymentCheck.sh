#!/bin/bash

# Pre-deployment check to validate the project structure and environment
# This script helps identify common issues before attempting deployment

echo "=========================================="
echo "D3R Protocol Pre-Deployment Check"
echo "=========================================="

# Check for the required environment variables
if [ -f .env ]; then
    source .env
    echo "✅ .env file found"

    # Check required variables
    MISSING_VARS=""
    
    if [ -z "$PRIVATE_KEY" ]; then MISSING_VARS="$MISSING_VARS PRIVATE_KEY"; fi
    if [ -z "$RPC_URL" ] && [ -z "$SEPOLIA_RPC_URL" ]; then MISSING_VARS="$MISSING_VARS RPC_URL"; fi
    if [ -z "$LINK_TOKEN_ADDRESS" ]; then MISSING_VARS="$MISSING_VARS LINK_TOKEN_ADDRESS"; fi
    if [ -z "$ORACLE_ADDRESS" ] && [ -z "$CHAINLINK_ORACLE_ADDRESS" ]; then MISSING_VARS="$MISSING_VARS ORACLE_ADDRESS"; fi
    if [ -z "$JOB_ID" ] && [ -z "$CHAINLINK_JOB_ID" ]; then MISSING_VARS="$MISSING_VARS JOB_ID"; fi
    
    if [ -n "$MISSING_VARS" ]; then
        echo "❌ Missing required environment variables: $MISSING_VARS"
    else
        echo "✅ All required environment variables found"
    fi
else
    echo "❌ .env file not found"
fi

# Check contract file existence
REQUIRED_CONTRACTS=("NGORegistry" "FundPool" "DonationTracker" "IPFSVerifier" "ChainlinkDisasterOracle" "MilestoneFunding" "D3RProtocol")
MISSING_CONTRACTS=""

for contract in "${REQUIRED_CONTRACTS[@]}"; do
    if [ -f "src/$contract.sol" ]; then
        echo "✅ Contract found: $contract.sol"
    else
        echo "❌ Contract NOT found: $contract.sol"
        MISSING_CONTRACTS="$MISSING_CONTRACTS $contract.sol"
    fi
done

if [ -n "$MISSING_CONTRACTS" ]; then
    echo -e "\n⚠️ WARNING: Some required contract files not found: $MISSING_CONTRACTS"
    echo "Make sure all contract files are in the src/ directory"
else
    echo -e "\n✅ All required contracts found in src/ directory"
fi

# Attempt to compile contracts
echo -e "\nTesting contract compilation..."
COMPILE_RESULT=$(forge build 2>&1)
if [ $? -eq 0 ]; then
    echo "✅ Contracts compile successfully"
else
    echo "❌ Contract compilation failed:"
    echo "$COMPILE_RESULT"
    echo -e "\nFIX: Make sure all imports point to the correct paths"
fi

# Check library imports
echo -e "\nChecking for proper library and import paths..."
IMPORTS=$(grep -r "import" --include="*.sol" src/)
WRONG_PATHS=$(echo "$IMPORTS" | grep -E "contracts/src|@chainlink/contracts" || echo "")

if [ -n "$WRONG_PATHS" ]; then
    echo "⚠️ Suspicious import paths detected:"
    echo "$WRONG_PATHS"
    echo -e "\nFIX: Make sure imports use relative paths like '../src/' or correct package names"
else
    echo "✅ Import paths look good"
fi

echo -e "\n=========================================="
echo "Pre-deployment check completed"
echo "If all checks passed, you're ready to deploy"
echo "Run: ./script/simple-deploy.sh"
echo "=========================================="
