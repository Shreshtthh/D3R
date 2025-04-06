#!/bin/bash

# Verification script for D3R Protocol contracts
# This script verifies all contracts on Etherscan
# Usage: ./verify-contracts.sh [CHAIN_ID]

# Default to Sepolia if not specified
CHAIN_ID=${1:-11155111}

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Check for Etherscan API key
if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo "Error: ETHERSCAN_API_KEY not set"
    echo "Set it in your .env file or as an environment variable"
    exit 1
fi

# Check for deployment addresses
if [ ! -f "deployment_addresses.txt" ]; then
    echo "Error: deployment_addresses.txt not found"
    echo "Run a deployment first or provide contract addresses manually"
    exit 1
fi

# Extract contract addresses
echo "Extracting contract addresses from deployment_addresses.txt..."
NGO_REGISTRY=$(grep "ngoRegistry:" deployment_addresses.txt | awk '{print $2}')
FUND_POOL=$(grep "fundPool:" deployment_addresses.txt | awk '{print $2}')
DONATION_TRACKER=$(grep "donationTracker:" deployment_addresses.txt | awk '{print $2}')
MILESTONE_FUNDING=$(grep "milestoneFunding:" deployment_addresses.txt | awk '{print $2}')
IPFS_VERIFIER=$(grep "ipfsVerifier:" deployment_addresses.txt | awk '{print $2}')
DISASTER_ORACLE=$(grep "disasterOracle:" deployment_addresses.txt | awk '{print $2}')
D3R_PROTOCOL=$(grep "d3rProtocol:" deployment_addresses.txt | awk '{print $2}')

# Verify contracts one by one
echo "Starting contract verification on chain ID: $CHAIN_ID"
echo "--------------------------------------------------------"

# Function to verify a contract
verify_contract() {
    local contract_address=$1
    local contract_name=$2
    local contract_path=$3
    local constructor_args=$4

    echo "Verifying $contract_name at $contract_address..."
    
    if [ -z "$constructor_args" ]; then
        # Contract without constructor arguments
        forge verify-contract \
            --chain-id $CHAIN_ID \
            --etherscan-api-key $ETHERSCAN_API_KEY \
            $contract_address \
            $contract_path:$contract_name
    else
        # Contract with constructor arguments
        forge verify-contract \
            --chain-id $CHAIN_ID \
            --etherscan-api-key $ETHERSCAN_API_KEY \
            --constructor-args $constructor_args \
            $contract_address \
            $contract_path:$contract_name
    fi
    
    RESULT=$?
    if [ $RESULT -eq 0 ]; then
        echo "✅ $contract_name verified successfully"
    else
        echo "❌ Failed to verify $contract_name"
    fi
    echo "--------------------------------------------------------"
}

# Get deployer address for NGORegistry constructor args
if [ ! -z "$PRIVATE_KEY" ]; then
    DEPLOYER=$(cast wallet address "$PRIVATE_KEY")
    echo "Using deployer address: $DEPLOYER"
else
    echo "Warning: PRIVATE_KEY not set, can't derive deployer address"
    echo "Enter deployer address manually for NGORegistry verification:"
    read DEPLOYER
fi

# Verify NGORegistry
verify_contract $NGO_REGISTRY "NGORegistry" "src/NGORegistry.sol" $(cast abi-encode "constructor(address)" $DEPLOYER)

# Verify FundPool
verify_contract $FUND_POOL "FundPool" "src/FundPool.sol" $(cast abi-encode "constructor(address)" $NGO_REGISTRY)

# Verify DonationTracker
verify_contract $DONATION_TRACKER "DonationTracker" "src/DonationTracker.sol" $(cast abi-encode "constructor(address)" $FUND_POOL)

# Verify IPFSVerifier (no constructor args)
verify_contract $IPFS_VERIFIER "IPFSVerifier" "src/IPFSVerifier.sol"

# Verify ChainlinkDisasterOracle
if [ -z "$LINK_TOKEN_ADDRESS" ]; then
    LINK_TOKEN_ADDRESS="0x779877A7B0D9E8603169DdbD7836e478b4624789" # Default Sepolia LINK
fi
if [ -z "$ORACLE_ADDRESS" ] && [ ! -z "$CHAINLINK_ORACLE_ADDRESS" ]; then
    ORACLE_ADDRESS=$CHAINLINK_ORACLE_ADDRESS
fi
if [ -z "$ORACLE_ADDRESS" ]; then
    ORACLE_ADDRESS="0x40193c8518BB267228Fc409a613bDbD8eC5a97b3" # Default from your deployment
fi
if [ -z "$JOB_ID" ] && [ ! -z "$CHAINLINK_JOB_ID" ]; then
    JOB_ID=$CHAINLINK_JOB_ID
fi
if [ -z "$JOB_ID" ]; then
    JOB_ID="7d80a6386ef543a3abb52817f6707e3b" # Default from your deployment
fi
if [ -z "$ORACLE_FEE" ] && [ ! -z "$CHAINLINK_FEE" ]; then
    ORACLE_FEE=$CHAINLINK_FEE
fi
if [ -z "$ORACLE_FEE" ]; then
    ORACLE_FEE="100000000000000000" # Default 0.1 LINK
fi

# Convert job ID to bytes32
JOB_ID_BYTES=$(cast format-bytes32-string $JOB_ID)

verify_contract $DISASTER_ORACLE "ChainlinkDisasterOracle" "src/ChainlinkDisasterOracle.sol" \
  $(cast abi-encode "constructor(address,address,bytes32,uint256)" $LINK_TOKEN_ADDRESS $ORACLE_ADDRESS $JOB_ID_BYTES $ORACLE_FEE)

# Verify MilestoneFunding
verify_contract $MILESTONE_FUNDING "MilestoneFunding" "src/MilestoneFunding.sol" \
  $(cast abi-encode "constructor(address,bytes32,uint256,address)" $ORACLE_ADDRESS $JOB_ID_BYTES $ORACLE_FEE $NGO_REGISTRY)

# Verify D3RProtocol
verify_contract $D3R_PROTOCOL "D3RProtocol" "src/D3RProtocol.sol" \
  $(cast abi-encode "constructor(address,address,address,address,address,address)" \
     $NGO_REGISTRY $FUND_POOL $DONATION_TRACKER $MILESTONE_FUNDING $IPFS_VERIFIER $DISASTER_ORACLE)

echo "Contract verification process completed"
