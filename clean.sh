#!/bin/bash

# Clean script for D3R Platform to fix common issues
# WSL-compatible version

echo "Cleaning the D3R Platform build artifacts..."

# Get the script's directory regardless of where it's called from
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Clean up frontend directory
echo "Cleaning up frontend directory..."
if [ -d "frontend" ]; then
  cd frontend
  rm -f .babelrc
  rm -rf node_modules .next
  cd ..
else
  echo "Frontend directory not found!"
fi

# Clean up root node_modules
echo "Cleaning up root node_modules..."
rm -rf node_modules

echo "Cleaning complete! Now run './setup.sh' to reinstall dependencies."
