#!/bin/bash

# Source bashrc to ensure forge is in the PATH
source ~/.bashrc
export PATH="$HOME/.foundry/bin:$PATH"

# Convert Windows path to WSL path if needed
function win_to_wsl_path() {
  if [[ "$1" == C:\\* ]]; then
    # Convert C:\path\to\file to /mnt/c/path/to/file
    local drive=$(echo "$1" | cut -c1 | tr '[:upper:]' '[:lower:]')
    local path=$(echo "$1" | cut -c4- | sed 's/\\/\//g')
    echo "/mnt/$drive$path"
  else
    echo "$1"
  fi
}

# Get the project directory
PROJECT_DIR=$(win_to_wsl_path "$(dirname "$(dirname "$(readlink -f "$0")")")")
cd "$PROJECT_DIR" || { echo "Failed to change directory to $PROJECT_DIR"; exit 1; }

# Print Forge version
echo "Using forge version: $(forge --version || echo 'forge not found')"
echo "Working directory: $(pwd)"

# Run the deployment script with proper arguments
forge script script/Deploy.s.sol --rpc-url "$RPC_URL" --private-key "$PRIVATE_KEY" --broadcast

# If successful, save addresses
if [ $? -eq 0 ]; then
    echo "Deployment successful! Saving addresses..."
    node scripts/save-addresses.js forge-deploy-log.txt
fi
