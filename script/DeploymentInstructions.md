# D3R Protocol Deployment Instructions

This document provides step-by-step instructions for deploying the D3R Protocol smart contracts to an EVM-compatible blockchain.

## Prerequisites

1. [Foundry](https://getfoundry.sh/) installed (latest version recommended)
2. Private key for deployment
3. LINK token for Chainlink Oracle integrations (for testnet or mainnet deployments)
4. RPC URL for target network

## All-in-One Deployment (RECOMMENDED)

For the most comprehensive deployment experience, use our all-in-one script:

```bash
# Make the script executable
chmod +x script/deploy-all.sh

# Run with your private key
./script/deploy-all.sh YOUR_PRIVATE_KEY

# Or specify private key, RPC URL, and gas price
./script/deploy-all.sh YOUR_PRIVATE_KEY https://your-rpc-url 5000000000
```

This script will:
1. Perform pre-deployment checks
2. Compile the contracts
3. Deploy the contracts
4. Extract and save contract addresses
5. Monitor transaction status
6. Provide tools for handling stuck transactions

## Handling Stuck Transactions

If your transactions are stuck in a "pending" state (which is common on test networks), you can use these tools:

### Check Transaction Status

```bash
# Make the script executable
chmod +x script/check-tx-status.sh

# Check status of a specific transaction
./script/check-tx-status.sh 0xYOUR_TRANSACTION_HASH
```

### Speed Up a Specific Transaction

```bash
# Make the script executable
chmod +x script/speed-up-tx.sh

# Speed up transaction with 1.5x gas price
./script/speed-up-tx.sh 0xYOUR_TRANSACTION_HASH 1.5

# Or use higher multiplier for very congested networks
./script/speed-up-tx.sh 0xYOUR_TRANSACTION_HASH 2.0
```

### Check All Pending Transactions

```bash
# Make the script executable
chmod +x script/resolve-pending-txs.sh

# Find and list all pending transactions
./script/resolve-pending-txs.sh
```

## Contract Verification

Once your contracts are deployed and confirmed, you can verify them on Etherscan:

```bash
# Verify a single contract
forge verify-contract --chain-id 11155111 --etherscan-api-key $ETHERSCAN_API_KEY \
  DEPLOYED_CONTRACT_ADDRESS src/ContractName.sol:ContractName
```

## Post-Deployment

After successful deployment, contract addresses will be saved to `deployment_addresses.txt`. This file contains addresses for:

- NGO Registry
- Fund Pool
- Donation Tracker
- Milestone Funding
- IPFS Verifier
- Chainlink Disaster Oracle
- D3R Protocol

## Testing the Deployed Contracts

After deployment is complete and all transactions are confirmed, you can run a simple test:

```bash
# Set contract addresses from your deployment
export NGO_REGISTRY=0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01
export FUND_POOL=0x52146d464e5DD3a7046940b85231007385AB3105
export DONATION_TRACKER=0x97154aCFa6f5E85494D0EFd2332368b13b2Da8dc
export MILESTONE_FUNDING=0xD09c0b1677107e25B78271dA70295580Bf8BEA52
export D3R_PROTOCOL=0xB0C04bF81c2D64cC5Ae4CCeaFe6906D391476304

# Run the deployment test
forge script script/DeploymentTest.s.sol:DeploymentTestScript \
  --rpc-url $RPC_URL --private-key $PRIVATE_KEY --broadcast
```

## Contract Interaction Guide

Once deployed, you can interact with the protocol by:

1. **Register NGOs** through NGORegistry
2. **Verify NGOs** by calling verifyNGO from the owner account
3. **Create relief projects** through the D3RProtocol contract
4. **Add milestones** to projects
5. **Donate** to projects through FundPool
6. **Submit reports** and proof of work via DonationTracker
7. **Approve milestones** to release funds
