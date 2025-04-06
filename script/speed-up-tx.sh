#!/bin/bash

# Script to speed up stuck pending transactions by resubmitting with higher gas price
# Usage: ./speed-up-tx.sh <TX_HASH> [GAS_MULTIPLIER]

if [ "$#" -lt 1 ]; then
    echo "Usage: ./speed-up-tx.sh <TX_HASH> [GAS_MULTIPLIER]"
    echo "Example: ./speed-up-tx.sh 0xf50532a795ed03259bd2c6135505750e62e1724a47ba6f10982c2d43eb728a12 1.5"
    exit 1
fi

# Get arguments
TX_HASH=$1
GAS_MULTIPLIER=${2:-1.5}

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

if [ -z "$PRIVATE_KEY" ]; then
    echo "Error: PRIVATE_KEY not set. Please set in .env file or as environment variable."
    exit 1
fi

echo "Looking up transaction $TX_HASH..."

# Get transaction details using cast
TX_DATA=$(cast tx --rpc-url "$RPC_URL" "$TX_HASH" 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "Error: Failed to retrieve transaction data. Check the transaction hash and RPC URL."
    exit 1
fi

# Extract transaction details
FROM_ADDR=$(echo "$TX_DATA" | grep "from" | awk '{print $2}')
TO_ADDR=$(echo "$TX_DATA" | grep "to" | awk '{print $2}')
VALUE=$(echo "$TX_DATA" | grep "value" | awk '{print $2}' | sed 's/,//g')
DATA=$(echo "$TX_DATA" | grep -A 1 "data" | tail -1 | tr -d '[:space:]')
NONCE=$(echo "$TX_DATA" | grep "nonce" | awk '{print $2}' | sed 's/,//g')
GAS_PRICE=$(echo "$TX_DATA" | grep "gasPrice" | awk '{print $2}' | sed 's/,//g')
GAS_LIMIT=$(echo "$TX_DATA" | grep "gas " | awk '{print $2}' | sed 's/,//g')

# Check if data is empty and set to "0x" if needed
if [ -z "$DATA" ] || [ "$DATA" == "" ]; then
    DATA="0x"
fi

# Calculate new gas price (multiply by factor)
NEW_GAS_PRICE=$(echo "$GAS_PRICE * $GAS_MULTIPLIER" | bc | cut -d '.' -f 1)

# If VALUE is empty, set to 0
if [ -z "$VALUE" ]; then
    VALUE="0"
fi

echo "Transaction details:"
echo "From: $FROM_ADDR"
echo "To: $TO_ADDR"
echo "Value: $VALUE wei"
echo "Data: ${DATA:0:20}... (truncated)"
echo "Nonce: $NONCE"
echo "Gas Limit: $GAS_LIMIT"
echo "Original gas price: $GAS_PRICE wei"
echo "New gas price: $NEW_GAS_PRICE wei (${GAS_MULTIPLIER}x higher)"

# Check user wallet
USER_ADDR=$(cast wallet address --private-key "$PRIVATE_KEY" 2>/dev/null)
if [ "$USER_ADDR" != "$FROM_ADDR" ]; then
    echo "⚠️ Warning: Your wallet address ($USER_ADDR) doesn't match the transaction sender ($FROM_ADDR)"
    read -p "Do you still want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 1
    fi
fi

# Check if the transaction is still pending
RECEIPT=$(cast receipt --rpc-url "$RPC_URL" "$TX_HASH" 2>/dev/null || echo "pending")
if [[ "$RECEIPT" != "pending" ]]; then
    echo "⚠️ Transaction is no longer pending! It has already been mined."
    exit 1
fi

# Ask for confirmation
read -p "Do you want to speed up this transaction with higher gas? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Operation cancelled."
    exit 1
fi

# Send the replacement transaction
echo "Sending replacement transaction..."
# For debugging, show the command
echo "Command: cast send --rpc-url \"$RPC_URL\" --private-key \"$PRIVATE_KEY\" --gas-price \"$NEW_GAS_PRICE\" --gas \"$GAS_LIMIT\" --nonce \"$NONCE\" --value \"$VALUE\" \"$TO_ADDR\" \"$DATA\""

# Execute the command
NEW_TX=$(cast send --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --gas-price "$NEW_GAS_PRICE" --gas "$GAS_LIMIT" --nonce "$NONCE" --value "$VALUE" "$TO_ADDR" "$DATA" 2>&1)
RESULT=$?

if [ $RESULT -eq 0 ]; then
    echo "✅ Replacement transaction sent: $NEW_TX"
    echo "You can check its status with:"
    echo "./script/check-tx-status.sh $NEW_TX"
else
    echo "❌ Failed to send replacement transaction."
    echo "Error: $NEW_TX"
    
    if [[ "$NEW_TX" == *"nonce too low"* ]]; then
        echo "The nonce is already used - transaction may have been confirmed while we were working."
        echo "Check status of original transaction: ./script/check-tx-status.sh $TX_HASH"
    elif [[ "$NEW_TX" == *"replacement transaction underpriced"* ]]; then
        echo "Gas price too low. Try a higher multiplier:"
        echo "./script/speed-up-tx.sh $TX_HASH 2.0"
    fi
fi
