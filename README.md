# Blockchain Disaster Relief Platform

A decentralized platform for disaster relief funding using blockchain technology.

## Prerequisites

- Node.js v16+ and npm
- Foundry (for smart contract deployment)

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd blockchain-d3r
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Install Forge dependencies:
   ```
   npm run install:deps
   ```

4. Configure environment variables:
   ```
   cp .env.example .env
   ```
   Then edit `.env` with your own values.

## Installing Foundry

To deploy contracts, you'll need Foundry. Install it with:

### On Linux/macOS:
```bash
curl -L https://foundry.paradigm.xyz | bash
source ~/.bashrc  # or ~/.zshrc depending on your shell
foundryup
```

### On Windows:
Install with PowerShell:
```powershell
Invoke-WebRequest -Uri "https://github.com/foundry-rs/foundry/releases/latest/download/foundry_nightly_win_x86_64.zip" -OutFile "foundry.zip"
Expand-Archive -Path "foundry.zip" -DestinationPath "$HOME\.foundry"
$env:Path += ";$HOME\.foundry\bin"
[Environment]::SetEnvironmentVariable("Path", $env:Path, [System.EnvironmentVariableTarget]::User)
```

## Deployment

### Automatic Deployment

To deploy all contracts:

## Foundry

**Foundry is a blazing fast, portable and modular toolkit for Ethereum application development written in Rust.**

Foundry consists of:

-   **Forge**: Ethereum testing framework (like Truffle, Hardhat and DappTools).
-   **Cast**: Swiss army knife for interacting with EVM smart contracts, sending transactions and getting chain data.
-   **Anvil**: Local Ethereum node, akin to Ganache, Hardhat Network.
-   **Chisel**: Fast, utilitarian, and verbose solidity REPL.

## Documentation

https://book.getfoundry.sh/

## Usage

### Build

```shell
$ forge build
```

### Test

```shell
$ forge test
```

### Format

```shell
$ forge fmt
```

### Gas Snapshots

```shell
$ forge snapshot
```

### Anvil

```shell
$ anvil
```

### Deploy

```shell
$ forge script script/Counter.s.sol:CounterScript --rpc-url <your_rpc_url> --private-key <your_private_key>
```

### Cast

```shell
$ cast <subcommand>
```

### Help

```shell
$ forge --help
$ anvil --help
$ cast --help
```
