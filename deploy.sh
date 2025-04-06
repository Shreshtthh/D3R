#!/bin/bash

# Simple wrapper script for deployment
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Check if we're running in WSL
if grep -q Microsoft /proc/version 2>/dev/null; then
    echo "Detected WSL environment"
fi

# Make sure scripts are executable
chmod +x scripts/*.sh 2>/dev/null || true

# Show help if requested
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    echo "Blockchain D3R Deployment Tool"
    echo "Usage: ./deploy.sh [options]"
    echo ""
    echo "Options:"
    echo "  --hardhat     Force Hardhat deployment"
    echo "  --foundry     Force Foundry deployment"
    echo "  --env         Just load environment variables"
    echo "  --check       Check environment without deploying"
    echo "  --fix-env     Fix .env file line endings"
    echo "  -h, --help    Show this help message"
    exit 0
fi

# Fix .env file if requested or automatically
if [ "$1" == "--fix-env" ] || [ ! -f .env ]; then
    ./scripts/fix-env-file.sh
    if [ "$1" == "--fix-env" ]; then
        exit $?
    fi
fi

# Check if we should just load environment variables
if [ "$1" == "--env" ]; then
    source ./scripts/env-load.sh
    exit $?
fi

# Check environment setup
if [ "$1" == "--check" ]; then
    echo "Checking environment..."
    source ./scripts/env-load.sh
    
    echo "Checking Foundry installation..."
    if command -v forge >/dev/null 2>&1; then
        echo "✓ Foundry is installed"
        forge --version
    else
        echo "✗ Foundry is not installed"
    fi
    
    echo "Checking Node.js installation..."
    if command -v node >/dev/null 2>&1; then
        echo "✓ Node.js is installed"
        node --version
    else
        echo "✗ Node.js is not installed"
    fi
    
    echo "Checking npm installation..."
    if command -v npm >/dev/null 2>&1; then
        echo "✓ npm is installed"
        npm --version
    else
        echo "✗ npm is not installed"
    fi
    
    echo "Checking contract compilation..."
    if [ -d "out" ] || [ -d "artifacts" ]; then
        echo "✓ Contracts appear to be compiled"
    else
        echo "✗ Contracts may not be compiled"
    fi
    
    echo "Environment check complete"
    exit 0
fi

# Check and fix .env file
echo "Checking .env file for Windows line endings..."
if file .env | grep -q CRLF; then
    echo "Detected Windows line endings in .env file"
    echo "Fixing line endings..."
    ./scripts/fix-env-file.sh
fi

# Source env-load.sh to properly load environment variables
echo "Loading environment variables..."
source ./scripts/env-load.sh

# Run the deployment script
./scripts/deploy.sh "$@"
