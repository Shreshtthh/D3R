@echo off
setlocal enabledelayedexpansion

:: Check if .env file exists
if not exist .env (
    echo Error: .env file not found. Please create it with the required environment variables.
    echo See DeploymentInstructions.md for details.
    exit /b 1
)

:: Load environment variables
for /f "tokens=1,2 delims==" %%a in (.env) do (
    set "%%a=%%b"
)

:: Validate required variables
if not defined PRIVATE_KEY (
    echo Error: PRIVATE_KEY is not set in .env file.
    exit /b 1
)

if not defined RPC_URL (
    echo Error: RPC_URL is not set in .env file.
    exit /b 1
)

:: Check if we should verify contracts
set VERIFY_FLAG=
if "%1"=="--verify" (
    if defined ETHERSCAN_API_KEY (
        set "VERIFY_FLAG=--verify --etherscan-api-key !ETHERSCAN_API_KEY!"
        echo Will verify contracts using Etherscan API key
    ) else (
        echo Warning: Cannot verify contracts - ETHERSCAN_API_KEY not set in .env file
    )
)

echo Starting deployment to network: %RPC_URL%

:: Run the deployment script - try alternative command format to avoid fork-url error
echo Running deployment with Foundry...
forge script --rpc-url %RPC_URL% script/Deploy.s.sol:DeployScript --private-key %PRIVATE_KEY% --broadcast %VERIFY_FLAG%

:: Check if deployment was successful
if %ERRORLEVEL% neq 0 (
    echo Deployment failed. Please check the error messages above.
    exit /b 1
)

echo Deployment completed successfully!

:: Try to extract contract addresses
for /f "tokens=1,2,3,4 delims=/" %%a in ('dir /b /s broadcast\Deploy.s.sol\*\run-latest.json') do (
    set LATEST_LOG=%%a/%%b/%%c/%%d
)

if defined LATEST_LOG (
    echo Extracting contract addresses from deployment logs...
    findstr /C:"=== Contract Addresses ===" "%LATEST_LOG%" /C:"ngoRegistry:" /C:"fundPool:" /C:"donationTracker:" /C:"milestoneFunding:" /C:"ipfsVerifier:" /C:"disasterOracle:" /C:"d3rProtocol:" > deployment_addresses.txt
    echo Contract addresses saved to deployment_addresses.txt
)

exit /b 0
