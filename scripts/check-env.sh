#!/bin/bash

echo "Checking environment variables..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "No .env file found. Creating from .env.example..."
    cp .env.example .env
    echo "Please fill in the values in the .env file and run this script again."
    exit 1
fi

# Source the .env file
source .env

# Check for missing 0x prefix
check_prefix() {
    VAR_NAME=$1
    VAR_VALUE=$2
    
    if [[ -n "$VAR_VALUE" && ! "$VAR_VALUE" == 0x* ]]; then
        echo "Warning: $VAR_NAME should start with '0x'. Current value: $VAR_VALUE"
        read -p "Add '0x' prefix? (y/n): " CONFIRM
        if [[ "$CONFIRM" == "y" || "$CONFIRM" == "Y" ]]; then
            # Update the .env file
            sed -i "s/$VAR_NAME=.*/$VAR_NAME=0x$VAR_VALUE/" .env
            echo "$VAR_NAME updated to 0x$VAR_VALUE"
        fi
    fi
}

# Check each hex variable
check_prefix "PRIVATE_KEY" "$PRIVATE_KEY"

# Special handling for CHAINLINK_JOB_ID - no 0x prefix needed
if [[ -n "$CHAINLINK_JOB_ID" ]]; then
    if [[ "$CHAINLINK_JOB_ID" == 0x* ]]; then
        echo "Note: CHAINLINK_JOB_ID has '0x' prefix. This will be automatically handled in the deployment script."
    else
        echo "Note: CHAINLINK_JOB_ID format is correct (no '0x' prefix needed)."
    fi
    
    # Check the length of the job ID
    JOB_ID_LENGTH=${#CHAINLINK_JOB_ID}
    if [[ "$CHAINLINK_JOB_ID" == 0x* ]]; then
        JOB_ID_LENGTH=$((JOB_ID_LENGTH - 2))  # Account for 0x prefix
    fi
    
    if [[ $JOB_ID_LENGTH -gt 64 ]]; then
        echo "Warning: CHAINLINK_JOB_ID is too long for bytes32 (max 64 hex characters without 0x)."
    fi
fi

echo "Environment check complete."
