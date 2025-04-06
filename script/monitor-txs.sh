#!/bin/bash

# Script to monitor and manage pending transactions
# This helps track or speed up transactions that are stuck in the mempool

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed."
    echo "Please install jq: sudo apt-get install jq"
    exit 1
fi

# Load RPC URL from environment or .env
if [ -z "$RPC_URL" ]; then
    if [ -f .env ]; then
        source .env
        # Also check for SEPOLIA_RPC_URL as fallback
        if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
            RPC_URL=$SEPOLIA_RPC_URL
        fi
    fi
    
    if [ -z "$RPC_URL" ]; then
        echo "Error: RPC_URL not set. Please set in .env file or as environment variable."
        exit 1
    fi
fi

# Find latest deployment file
LATEST_BROADCAST=$(find broadcast -name "run-latest.json" | sort -r | head -1)

if [ -z "$LATEST_BROADCAST" ]; then
    echo "Error: No deployment broadcast file found."
    echo "Please run a deployment first."
    exit 1
fi

echo "Monitoring transactions from: $LATEST_BROADCAST"
echo "Using RPC URL: $RPC_URL"

# Extract transactions from broadcast file
TRANSACTIONS=$(cat "$LATEST_BROADCAST" | jq -r '.transactions[] | .hash')
TX_COUNT=$(echo "$TRANSACTIONS" | wc -l)

echo "Found $TX_COUNT transactions to monitor."
echo "Starting transaction monitoring..."
echo "Press Ctrl+C to exit."
echo "------------------------------------"

# Function to check transaction status
check_tx_status() {
    local tx_hash="$1"
    local result=$(cast receipt --rpc-url "$RPC_URL" "$tx_hash" 2>/dev/null || echo "pending")
    
    if [[ "$result" == "pending" ]]; then
        echo "PENDING"
        return 1
    fi
    
    # Check if it has a status field (confirmed)
    if echo "$result" | grep -q "status"; then
        local status=$(echo "$result" | grep "status" | awk '{print $2}')
        if [[ "$status" == "1" ]]; then
            echo "CONFIRMED"
            return 0
        else
            echo "FAILED"
            return 2
        fi
    fi
    
    echo "UNKNOWN"
    return 3
}

# Monitor transactions
CONFIRMED=0
while [ $CONFIRMED -lt $TX_COUNT ]; do
    CONFIRMED=0
    echo -e "\n$(date +"%H:%M:%S") - Checking transaction status..."
    
    for tx in $TRANSACTIONS; do
        STATUS=$(check_tx_status "$tx")
        ABBREV_TX="${tx:0:10}...${tx: -6}"
        
        if [[ "$STATUS" == "CONFIRMED" ]]; then
            echo "✅ $ABBREV_TX: $STATUS"
            ((CONFIRMED++))
        elif [[ "$STATUS" == "FAILED" ]]; then
            echo "❌ $ABBREV_TX: $STATUS"
            ((CONFIRMED++))
        else
            # Only show pending after 2 minutes
            PENDING_TIME=$(cat "$LATEST_BROADCAST" | jq -r ".transactions[] | select(.hash==\"$tx\") | .timestamp")
            CURRENT_TIME=$(date +%s)
            ELAPSED=$((CURRENT_TIME - PENDING_TIME))
            
            if [ $ELAPSED -gt 120 ]; then
                echo "⏳ $ABBREV_TX: $STATUS (pending for $(($ELAPSED/60)) min) - Consider speeding up!"
            else
                echo "⏳ $ABBREV_TX: $STATUS (pending for $ELAPSED sec)"
            fi
        fi
    done
    
    # Show progress
    echo -e "\nProgress: $CONFIRMED/$TX_COUNT transactions confirmed"
    
    if [ $CONFIRMED -lt $TX_COUNT ]; then
        echo "Waiting 30 seconds before next check..."
        sleep 30
    fi
done

echo -e "\n✅ All transactions have been processed!"
echo "Your deployment is complete."
