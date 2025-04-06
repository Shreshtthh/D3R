# D3R - Decentralized Disaster Donation & Relief Platform

D3R is a blockchain-based platform for transparent and accountable disaster relief donations with milestone-based fund releases.

## Quick Start

1. Set up the project dependencies:

```bash
# On Linux/macOS:
./setup.sh

# On Windows:
.\setup.bat

# On Windows Subsystem for Linux (WSL):
npm run wsl-setup

# Or manually:
npm run setup
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:4000](http://localhost:4000) with your browser to see the result.

## Troubleshooting

If you encounter any issues with the build or dependencies:

1. Clean the installation:
```bash
# On Linux/macOS:
./clean.sh

# On Windows:
.\clean.bat

# On Windows Subsystem for Linux (WSL):
npm run wsl-clean

# Or using npm:
npm run clean
```

2. Reinstall dependencies:
```bash
# On Linux/macOS:
./setup.sh

# On Windows:
.\setup.bat

# On Windows Subsystem for Linux (WSL):
npm run wsl-setup

# Or using npm:
npm run setup
```

### Special Notes for WSL Users

When using WSL to run this project from a Windows filesystem location (e.g., `/mnt/c/Program Files/blockchain-d3r`):

1. Use the WSL-specific npm scripts: `npm run wsl-clean` and `npm run wsl-setup`
2. You might encounter file permission issues. If so, within WSL, run:
   ```bash
   chmod +x *.sh
   ```
3. To avoid path issues, always navigate to the project directory before running commands

## Smart Contracts

The D3R platform uses the following smart contracts:

- **D3RProtocol**: Main orchestration contract (0xB0C04bF81c2D64cC5Ae4CCeaFe6906D391476304)
- **MilestoneFunding**: Handles milestone-based fund releases (0xD09c0b1677107e25B78271dA70295580Bf8BEA52)
- **NGORegistry**: Verifies humanitarian organizations (0x8e675e5C8efF2398D70eeeE62Bd85AB8084b8A01)
- **ChainlinkDisasterOracle**: Validates disaster information (0x109457d4c8501174f774339E4B37635e3f818C94)
- **IPFSVerifier**: Validates evidence documentation (0x4DF627FCDf639D6a4dc420924Df6709e404493c4)
- **FundPool**: Manages donation pools (0x52146d464e5DD3a7046940b85231007385AB3105)
- **DonationTracker**: Tracks donations and reports (0x97154aCFa6f5E85494D0EFd2332368b13b2Da8dc)

## Features

- Transparent disaster relief donations on the blockchain
- Milestone-based fund releases with verification
- Chainlink Oracle integration for disaster verification
- IPFS integration for storing and verifying relief documentation
- NGO verification system
