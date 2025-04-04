// Global state
const state = {
    provider: null,
    signer: null,
    account: null,
    networkId: null,
    contracts: {
        ngoRegistry: null,
        fundPool: null,
        donationTracker: null
    }
};

// Contract ABIs
let CONTRACT_ABIS = {};
let CONTRACT_ADDRESSES = {};

// DOM Elements
const connectWalletBtn = document.getElementById('connect-wallet');
const alertContainer = document.getElementById('alert-container');

// Navigation elements
const navLinks = {
    home: document.getElementById('nav-home'),
    ngo: document.getElementById('nav-ngo'),
    disaster: document.getElementById('nav-disaster'),
    donate: document.getElementById('nav-donate'),
    milestone: document.getElementById('nav-milestone')
};

// Content sections
const sections = {
    home: document.getElementById('home-section'),
    ngo: document.getElementById('ngo-section'),
    disaster: document.getElementById('disaster-section'),
    donate: document.getElementById('donate-section'),
    milestone: document.getElementById('milestone-section')
};

// Additional buttons
const gotoButtons = {
    ngo: document.getElementById('goto-ngo-btn'),
    disaster: document.getElementById('goto-disaster-btn'),
    donate: document.getElementById('goto-donate-btn')
};

// Forms
const forms = {
    ngoRegistration: document.getElementById('ngo-registration-form'),
    disasterRegistration: document.getElementById('disaster-registration-form'),
    milestone: document.getElementById('milestone-form')
};

// Load contract ABIs
async function loadContractABIs() {
    try {
        const abiPromises = [
            fetch('/abis/NGORegistry.json').then(res => res.json()),
            fetch('/abis/FundPool.json').then(res => res.json()),
            fetch('/abis/DonationTracker.json').then(res => res.json())
        ];
        
        const [ngoRegistryABI, fundPoolABI, donationTrackerABI] = await Promise.all(abiPromises);
        
        CONTRACT_ABIS = {
            ngoRegistry: ngoRegistryABI,
            fundPool: fundPoolABI,
            donationTracker: donationTrackerABI
        };
        
        console.log('Contract ABIs loaded successfully');
    } catch (error) {
        console.error('Error loading contract ABIs:', error);
        showAlert('Failed to load contract information. Please refresh the page.', 'danger');
    }
}

// Initialize contract addresses
async function initContractAddresses() {
    try {
        // Fetch contract addresses from server
        const response = await fetch('/api/contract-addresses');
        const addresses = await response.json();
        
        if (addresses.success) {
            CONTRACT_ADDRESSES = {
                ngoRegistry: addresses.data.ngoRegistry,
                fundPool: addresses.data.fundPool,
                donationTracker: addresses.data.donationTracker,
                chainlinkOracle: addresses.data.chainlinkOracle
            };
            console.log('Contract addresses loaded from server');
        } else {
            throw new Error('Failed to load contract addresses');
        }
    } catch (error) {
        console.error('Error loading contract addresses:', error);
        // Fallback to hardcoded values for development
        CONTRACT_ADDRESSES = {
            ngoRegistry: '0x123...',  // Replace with development address
            fundPool: '0x456...',     // Replace with development address
            donationTracker: '0x789...', // Replace with development address
            chainlinkOracle: '0xabc...' // Replace with development address
        };
        console.warn('Using fallback contract addresses');
    }
}

// Initialize ethers and contracts
async function initEthers() {
    try {
        // Check if MetaMask is installed
        if (window.ethereum) {
            // Create provider
            state.provider = new ethers.providers.Web3Provider(window.ethereum);
            
            // Listen for account changes
            window.ethereum.on('accountsChanged', handleAccountChange);
            window.ethereum.on('chainChanged', () => window.location.reload());
            
            console.log('Ethers initialized with MetaMask provider');
        } else {
            console.log('MetaMask not found. Using read-only provider');
            // Fallback to a public RPC endpoint for read-only functionality
            state.provider = new ethers.providers.JsonRpcProvider('https://sepolia.infura.io/v3/your-project-id');
        }
        
        // Initialize contract instances (read-only)
        initContractInstances();
    } catch (error) {
        console.error('Error initializing ethers:', error);
        showAlert('Failed to initialize blockchain connection.', 'danger');
    }
}

// Initialize contract instances
function initContractInstances() {
    if (!state.provider) return;
    
    try {
        state.contracts.ngoRegistry = new ethers.Contract(
            CONTRACT_ADDRESSES.ngoRegistry,
            CONTRACT_ABIS.ngoRegistry,
            state.provider
        );
        
        state.contracts.fundPool = new ethers.Contract(
            CONTRACT_ADDRESSES.fundPool,
            CONTRACT_ABIS.fundPool,
            state.provider
        );
        
        state.contracts.donationTracker = new ethers.Contract(
            CONTRACT_ADDRESSES.donationTracker,
            CONTRACT_ABIS.donationTracker,
            state.provider
        );
        
        console.log('Contract instances initialized');
    } catch (error) {
        console.error('Error initializing contract instances:', error);
    }
}

// Connect wallet function
async function connectWallet() {
    try {
        if (!window.ethereum) {
            showAlert('MetaMask is not installed. Please install it to use this application.', 'warning');
            return;
        }
        
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        state.account = accounts[0];
        
        // Get the signer
        state.signer = state.provider.getSigner();
        
        // Update contract instances to use signer
        state.contracts.ngoRegistry = state.contracts.ngoRegistry.connect(state.signer);
        state.contracts.fundPool = state.contracts.fundPool.connect(state.signer);
        state.contracts.donationTracker = state.contracts.donationTracker.connect(state.signer);
        
        // Get network ID
        const network = await state.provider.getNetwork();
        state.networkId = network.chainId;
        
        // Update UI
        updateWalletUI();
        
        showAlert('Wallet connected successfully!', 'success');
        console.log('Wallet connected:', state.account);
    } catch (error) {
        console.error('Error connecting wallet:', error);
        showAlert('Failed to connect wallet.', 'danger');
    }
}

// Handle account change
function handleAccountChange(accounts) {
    if (accounts.length === 0) {
        // User disconnected their wallet
        state.account = null;
        state.signer = null;
        
        // Reset contract instances to read-only
        initContractInstances();
        
        // Update UI
        updateWalletUI();
        
        showAlert('Wallet disconnected.', 'warning');
        console.log('Wallet disconnected');
    } else {
        // User switched accounts
        state.account = accounts[0];
        
        // Update signer
        state.signer = state.provider.getSigner();
        
        // Update contract instances to use new signer
        state.contracts.ngoRegistry = state.contracts.ngoRegistry.connect(state.signer);
        state.contracts.fundPool = state.contracts.fundPool.connect(state.signer);
        state.contracts.donationTracker = state.contracts.donationTracker.connect(state.signer);
        
        // Update UI
        updateWalletUI();
        
        showAlert('Account changed.', 'info');
        console.log('Account changed:', state.account);
    }
}

// Update wallet UI
function updateWalletUI() {
    if (state.account) {
        connectWalletBtn.textContent = `${state.account.substring(0, 6)}...${state.account.substring(38)}`;
        connectWalletBtn.classList.remove('btn-light');
        connectWalletBtn.classList.add('btn-success');
    } else {
        connectWalletBtn.textContent = 'Connect Wallet';
        connectWalletBtn.classList.remove('btn-success');
        connectWalletBtn.classList.add('btn-light');
    }
}

// Show alert function
function showAlert(message, type = 'info', duration = 5000) {
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto-dismiss after duration
    setTimeout(() => {
        alert.classList.remove('show');
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, duration);
}

// Navigate to section
function navigateToSection(sectionId) {
    // Hide all sections
    Object.values(sections).forEach(section => {
        section.classList.add('d-none');
    });
    
    // Show the selected section
    sections[sectionId].classList.remove('d-none');
    
    // Update active nav link
    Object.entries(navLinks).forEach(([id, link]) => {
        if (id === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// Setup event listeners
function setupEventListeners() {
    // Wallet connection
    connectWalletBtn.addEventListener('click', connectWallet);
    
    // Navigation
    Object.entries(navLinks).forEach(([sectionId, link]) => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToSection(sectionId);
        });
    });
    
    // Go-to buttons
    gotoButtons.ngo.addEventListener('click', () => navigateToSection('ngo'));
    gotoButtons.disaster.addEventListener('click', () => navigateToSection('disaster'));
    gotoButtons.donate.addEventListener('click', () => navigateToSection('donate'));
    
    // Form submissions
    forms.ngoRegistration.addEventListener('submit', handleNGORegistration);
    forms.disasterRegistration.addEventListener('submit', handleDisasterRegistration);
    forms.milestone.addEventListener('submit', handleMilestoneSubmission);
}

// Handle NGO registration
async function handleNGORegistration(event) {
    event.preventDefault();
    
    if (!state.account) {
        showAlert('Please connect your wallet first.', 'warning');
        return;
    }
    
    try {
        const ngoId = document.getElementById('ngo-id').value;
        const ngoName = document.getElementById('ngo-name').value;
        const ngoWebsite = document.getElementById('ngo-website').value;
        const ngoContact = document.getElementById('ngo-contact').value;
        const ngoDocsInput = document.getElementById('ngo-docs');
        
        if (!ngoDocsInput.files || ngoDocsInput.files.length === 0) {
            showAlert('Please upload verification documents.', 'warning');
            return;
        }
        
        showAlert('Preparing to register NGO...', 'info');
        
        // Create form data for API request
        const formData = new FormData();
        formData.append('ngoId', ngoId);
        formData.append('ngoName', ngoName);
        formData.append('website', ngoWebsite);
        formData.append('contact', ngoContact);
        
        // Add all files
        for (let i = 0; i < ngoDocsInput.files.length; i++) {
            formData.append('documents', ngoDocsInput.files[i]);
        }
        
        // Call API to register NGO
        const response = await fetch('/api/ngo/register', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('NGO registered successfully! Verification pending.', 'success');
            forms.ngoRegistration.reset();
            
            // Navigate back to home after successful registration
            setTimeout(() => navigateToSection('home'), 3000);
        } else {
            showAlert(`Registration failed: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error registering NGO:', error);
        showAlert('Failed to register NGO. Please try again.', 'danger');
    }
}

// Handle disaster registration
async function handleDisasterRegistration(event) {
    event.preventDefault();
    
    if (!state.account) {
        showAlert('Please connect your wallet first.', 'warning');
        return;
    }
    
    try {
        const disasterId = document.getElementById('disaster-id').value;
        const disasterName = document.getElementById('disaster-name').value;
        const disasterLocation = document.getElementById('disaster-location').value;
        const disasterType = document.getElementById('disaster-type').value;
        const disasterDate = document.getElementById('disaster-date').value;
        const evidenceInput = document.getElementById('disaster-evidence');
        
        if (!evidenceInput.files || evidenceInput.files.length === 0) {
            showAlert('Please upload evidence files.', 'warning');
            return;
        }
        
        showAlert('Preparing to register disaster...', 'info');
        
        // Create form data for API request
        const formData = new FormData();
        formData.append('disasterId', disasterId);
        formData.append('disasterName', disasterName);
        
        if (disasterLocation) formData.append('disasterLocation', disasterLocation);
        if (disasterType) formData.append('disasterType', disasterType);
        if (disasterDate) formData.append('date', disasterDate);
        
        // Add all files
        for (let i = 0; i < evidenceInput.files.length; i++) {
            formData.append('evidence', evidenceInput.files[i]);
        }
        
        // Call API to register disaster
        const response = await fetch('/api/disaster/register', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Disaster registered successfully!', 'success');
            forms.disasterRegistration.reset();
            
            // Navigate back to home after successful registration
            setTimeout(() => navigateToSection('home'), 3000);
        } else {
            showAlert(`Registration failed: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error registering disaster:', error);
        showAlert('Failed to register disaster. Please try again.', 'danger');
    }
}

// Handle milestone submission
async function handleMilestoneSubmission(event) {
    event.preventDefault();
    
    if (!state.account) {
        showAlert('Please connect your wallet first.', 'warning');
        return;
    }
    
    try {
        const projectId = document.getElementById('project-id').value;
        const milestoneNumber = document.getElementById('milestone-number').value;
        const description = document.getElementById('milestone-description').value;
        const docsInput = document.getElementById('milestone-docs');
        
        if (!docsInput.files || docsInput.files.length === 0) {
            showAlert('Please upload proof documents.', 'warning');
            return;
        }
        
        showAlert('Preparing to submit milestone proof...', 'info');
        
        // Create form data for API request
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('milestoneNumber', milestoneNumber);
        formData.append('description', description);
        
        // Add all files
        for (let i = 0; i < docsInput.files.length; i++) {
            formData.append('documents', docsInput.files[i]);
        }
        
        // Call API to submit milestone proof
        const response = await fetch('/api/milestone/proof', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Milestone proof submitted successfully!', 'success');
            forms.milestone.reset();
            
            // Navigate back to home after successful submission
            setTimeout(() => navigateToSection('home'), 3000);
        } else {
            showAlert(`Submission failed: ${result.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error submitting milestone proof:', error);
        showAlert('Failed to submit milestone proof. Please try again.', 'danger');
    }
}

// Initialize the application
async function init() {
    try {
        await loadContractABIs();
        await initContractAddresses();
        await initEthers();
        setupEventListeners();
        
        // Set initial section
        navigateToSection('home');
        
        console.log('Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        showAlert('Failed to initialize application. Please refresh the page.', 'danger');
    }
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
