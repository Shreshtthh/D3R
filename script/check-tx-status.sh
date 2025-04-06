#!/bin/bash

# Script to check the status of a specific transaction
# Usage: ./check-tx-status.sh <TX_HASH> [RPC_URL]

if [ "$#" -lt 1 ]; then
    echo "Usage: ./check-tx-status.sh <TX_HASH> [RPC_URL]"
    echo "Example: ./check-tx-status.sh 0xf50532a795ed03259bd2c6135505750e62e1724a47ba6f10982c2d43eb728a12"
    exit 1
fi

TX_HASH=$1

# Get RPC URL from arguments or environment
if [ "$#" -ge 2 ]; then
    RPC_URL=$2
else
    # Try to load from environment
    if [ -z "$RPC_URL" ]; then
        if [ -f .env ]; then
            source .env
            # Check for SEPOLIA_RPC_URL as fallback
            if [ -z "$RPC_URL" ] && [ ! -z "$SEPOLIA_RPC_URL" ]; then
                RPC_URL=$SEPOLIA_RPC_URL
            fi
        fi
        
        if [ -z "$RPC_URL" ]; then
            RPC_URL="https://sepolia.infura.io/v3/ab111591b0a84fb4920f9dfd7f940d27"
            echo "Using default Sepolia RPC URL"
        fi
    fi
fi

echo "Checking transaction: $TX_HASH"
echo "Using RPC URL: $RPC_URL"

# Check if the transaction is in the mempool (pending)
PENDING=$(cast tx --rpc-url "$RPC_URL" "$TX_HASH" 2>/dev/null || echo "Transaction not found")

if [[ "$PENDING" == *"Transaction not found"* ]]; then
    echo "❌ Transaction not found. It may not have been broadcasted correctly."
    exit 1
fi

# Check if the transaction has been mined
RECEIPT=$(cast receipt --rpc-url "$RPC_URL" "$TX_HASH" 2>/dev/null || echo "pending")

if [[ "$RECEIPT" == "pending" ]]; then
    echo "⏳ Transaction is still PENDING."
    
    # Get transaction details
    GAS_PRICE=$(echo "$PENDING" | grep "gasPrice" | awk '{print $2}')
    NONCE=$(echo "$PENDING" | grep "nonce" | awk '{print $2}')
    
    echo "Gas Price: $GAS_PRICE wei"
    echo "Nonce: $NONCE"
    
    echo ""
    echo "To speed up this transaction, use:"
    echo "./script/speed-up-tx.sh $TX_HASH 1.5"
    echo ""
    echo "This will submit a new transaction with the same nonce but 50% higher gas price."
    
    # Check network gas prices
    BASE_FEE=$(cast gas-price --rpc-url "$RPC_URL" 2>/dev/null || echo "unknown")
    if [ "$BASE_FEE" != "unknown" ]; then
        echo "Current network base fee: $BASE_FEE wei"
        if (( BASE_FEE > GAS_PRICE )); then
            echo "⚠️ Your gas price is BELOW the current network base fee, which may explain why your transaction is stuck."
            SUGGESTED=$(echo "$BASE_FEE * 1.2" | bc | cut -d '.' -f 1)
            echo "Suggested gas price: $SUGGESTED wei"
        fi
    fi
    
else
    # Transaction has been mined
    STATUS=$(echo "$RECEIPT" | grep "status" | awk '{print $2}')
    BLOCK=$(echo "$RECEIPT" | grep "block number" | awk '{print $3}')
    
    if [[ "$STATUS" == "1" ]]; then
        echo "✅ Transaction CONFIRMED in block $BLOCK"
        echo "Transaction successful"
    else
        echo "❌ Transaction FAILED in block $BLOCK"
        echo "Check transaction on block explorer for more details"
    fi
    
    # Get gas used
    GAS_USED=$(echo "$RECEIPT" | grep "gas used" | awk '{print $3}')
    echo "Gas used: $GAS_USED"
fi
