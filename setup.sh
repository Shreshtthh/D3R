#!/bin/bash

# Setup script for D3R Platform
# WSL-compatible version

echo "Setting up the D3R Platform..."

# Get the script's directory regardless of where it's called from
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Make scripts executable in case they lost permissions in WSL
chmod +x *.sh

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Clean up frontend directory to remove potential conflicts
echo "Cleaning up frontend directory..."
if [ -d "frontend" ]; then
  cd frontend
  rm -f .babelrc
  rm -rf node_modules .next
  
  # Navigate back to project root
  cd ..
else
  echo "Frontend directory not found!"
  exit 1
fi

# Navigate to frontend directory and install dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install

echo "Setup complete! You can now run 'npm run dev' to start the development server."
