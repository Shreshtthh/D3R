#!/bin/bash

# Script to find and help speed up all pending transactions
# from the latest deployment

# Load environment variables
if [ -f .env ]; then
    source .env
fi

# Support both RPC_URL and SEPOLIA_RPC_URL
if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
    RPC_URL=$SEPOLIA_RPC_URL
fi

if [ -z "$RPC_URL" ]; then
    echo "Error: RPC_URL not set. Please set in .env file or as environment variable."
    exit 1
fi

# Get gas price multiplier from arguments
MULTIPLIER=${1:-1.5}

# Find latest deployment file
LATEST_BROADCAST=$(find broadcast -name "run-latest.json" | sort -r | head -1)

if [ -z "$LATEST_BROADCAST" ]; then
    echo "Error: No deployment broadcast file found."
    echo "Please run a deployment first."
    exit 1
fi

echo "Checking transactions from: $LATEST_BROADCAST"
echo "Using RPC URL: $RPC_URL"
echo "Gas price multiplier: ${MULTIPLIER}x"

# Check if jq is available
if ! command -v jq &> /dev/null; then
    echo "Warning: jq is not installed. Using grep/awk fallback."
    # Extract transactions using grep/awk
    TX_DATA=$(cat "$LATEST_BROADCAST" | grep -o '"hash": "[^"]*"' | awk -F'"' '{print $4}')
    readarray -t TRANSACTIONS <<< "$TX_DATA"
else
    # Extract transactions using jq
    TRANSACTIONS=($(jq -r '.transactions[].hash' "$LATEST_BROADCAST"))
fi

TX_COUNT=${#TRANSACTIONS[@]}

if [ $TX_COUNT -eq 0 ]; then
    echo "No transactions found in the broadcast file."
    exit 1
fi

echo "Found $TX_COUNT transactions to check."
echo "------------------------------------"

PENDING_COUNT=0
CONFIRMED_COUNT=0
FAILED_COUNT=0
PENDING_TXS=()
PENDING_NONCES=()

# Check all transactions
for tx in "${TRANSACTIONS[@]}"; do
    echo "Checking transaction: $tx"
    
    # Check if the transaction has been mined
    RECEIPT=$(cast receipt --rpc-url "$RPC_URL" "$tx" 2>/dev/null || echo "pending")
    
    if [[ "$RECEIPT" == "pending" ]]; then
        echo "⏳ PENDING"
        PENDING_COUNT=$((PENDING_COUNT + 1))
        PENDING_TXS+=("$tx")
        
        # Get the nonce
        TX_DATA=$(cast tx --rpc-url "$RPC_URL" "$tx" 2>/dev/null)
        NONCE=$(echo "$TX_DATA" | grep "nonce" | awk '{print $2}')
        PENDING_NONCES+=("$NONCE")
        echo "  Nonce: $NONCE"
        
    else
        STATUS=$(echo "$RECEIPT" | grep "status" | awk '{print $2}')
        BLOCK=$(echo "$RECEIPT" | grep "block number" | awk '{print $3}')
        
        if [[ "$STATUS" == "1" ]]; then
            echo "✅ CONFIRMED in block $BLOCK"
            CONFIRMED_COUNT=$((CONFIRMED_COUNT + 1))
        else
            echo "❌ FAILED in block $BLOCK"
            FAILED_COUNT=$((FAILED_COUNT + 1))
        fi
    fi
    
    echo "------------------------------------"
done

echo "Summary:"
echo "- Total transactions: $TX_COUNT"
echo "- Confirmed: $CONFIRMED_COUNT"
echo "- Failed: $FAILED_COUNT"
echo "- Pending: $PENDING_COUNT"

if [ $PENDING_COUNT -gt 0 ]; then
    echo ""
    echo "The following transactions are still pending:"
    
    for i in "${!PENDING_TXS[@]}"; do
        echo "[$((i+1))] TX: ${PENDING_TXS[$i]} | Nonce: ${PENDING_NONCES[$i]}"
    done
    
    echo ""
    echo "Options to resolve pending transactions:"
    echo "1. Wait longer - transactions might still go through"
    echo "2. Speed up a specific transaction:"
    echo "   ./script/speed-up-tx.sh <TX_HASH> $MULTIPLIER"
    echo "3. Speed up all pending transactions:"
    
    if [ -z "$PRIVATE_KEY" ]; then
        echo "   First set PRIVATE_KEY in your environment, then run:"
    else
        echo "   Run the following commands:"
    fi
    
    for i in "${!PENDING_TXS[@]}"; do
        echo "   ./script/speed-up-tx.sh ${PENDING_TXS[$i]} $MULTIPLIER"
    done
fi
