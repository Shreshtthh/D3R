#!/bin/bash
# Sets up mock contracts for testing

MOCKS_DIR="test/mocks"
CHAINLINK_DIR="lib/chainlink/contracts/src/v0.8"

# Ensure directories exist
mkdir -p "$CHAINLINK_DIR"
mkdir -p "$CHAINLINK_DIR/interfaces"

# Create mock Chainlink interface
cat > "$CHAINLINK_DIR/ChainlinkClient.sol" << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// This is a mock version of ChainlinkClient for testing purposes
abstract contract ChainlinkClient {
    // This is an empty mock just to make imports work
    // The real implementation is mocked in ChainlinkClientMock.sol
}
EOF

# Create VRFV2Wrapper mock
cat > "$CHAINLINK_DIR/VRFV2Wrapper.sol" << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract VRFV2Wrapper {
    // This is an empty mock just to make imports work
}
EOF

echo "Mock contracts setup complete."
