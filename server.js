require('dotenv').config();
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Import our modules
const { 
    DOCUMENT_TYPES, 
    uploadFileToPinata, 
    uploadDirectoryToPinata 
} = require('./upload');

const {
    registerNGO,
    submitMilestoneProof,
    registerDisaster,
    requestDisasterVerification,
    checkDisasterVerification
} = require('./contract-integration');

// Import contract addresses config
const { getContractAddresses } = require('./config/contracts');

// Initialize Express app
const app = express();
const port = process.env.PORT || 3000;

// Set up middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniquePrefix = uuidv4().substring(0, 8);
        cb(null, `${uniquePrefix}-${file.originalname}`);
    }
});

const upload = multer({ storage });

// API Routes

// NGO Registration
app.post('/api/ngo/register', upload.array('documents'), async (req, res) => {
    try {
        const { ngoId, ngoName } = req.body;
        
        if (!ngoId || !ngoName || !req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields or documents' 
            });
        }
        
        // Create temporary directory for this upload
        const uploadDir = path.join(__dirname, 'uploads', `ngo-${ngoId}-${Date.now()}`);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Move uploaded files to the directory
        req.files.forEach(file => {
            fs.renameSync(file.path, path.join(uploadDir, file.filename));
        });
        
        // Register NGO with the uploaded documents
        const result = await registerNGO(ngoId, ngoName, uploadDir);
        
        // Cleanup temporary files after successful upload
        fs.rmSync(uploadDir, { recursive: true, force: true });
        
        res.json({
            success: true,
            message: 'NGO registered successfully',
            data: result
        });
    } catch (error) {
        console.error('Error registering NGO:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to register NGO',
            error: error.message
        });
    }
});

// Submit milestone proof
app.post('/api/milestone/proof', upload.array('documents'), async (req, res) => {
    try {
        const { projectId, milestoneNumber } = req.body;
        
        if (!projectId || !milestoneNumber || !req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields or documents' 
            });
        }
        
        // Create temporary directory for this upload
        const uploadDir = path.join(__dirname, 'uploads', `milestone-${projectId}-${milestoneNumber}-${Date.now()}`);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Move uploaded files to the directory
        req.files.forEach(file => {
            fs.renameSync(file.path, path.join(uploadDir, file.filename));
        });
        
        // Submit milestone proof with the uploaded documents
        const result = await submitMilestoneProof(projectId, milestoneNumber, uploadDir);
        
        // Cleanup temporary files after successful upload
        fs.rmSync(uploadDir, { recursive: true, force: true });
        
        res.json({
            success: true,
            message: 'Milestone proof submitted successfully',
            data: result
        });
    } catch (error) {
        console.error('Error submitting milestone proof:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to submit milestone proof',
            error: error.message
        });
    }
});

// Register disaster
app.post('/api/disaster/register', upload.array('evidence'), async (req, res) => {
    try {
        const { disasterId, disasterName, disasterLocation, disasterType, date } = req.body;
        
        if (!disasterId || !disasterName || !req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields or evidence' 
            });
        }
        
        // Create temporary directory for this upload
        const uploadDir = path.join(__dirname, 'uploads', `disaster-${disasterId}-${Date.now()}`);
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        // Move uploaded files to the directory
        req.files.forEach(file => {
            fs.renameSync(file.path, path.join(uploadDir, file.filename));
        });
        
        // Register disaster with or without Chainlink verification
        let result;
        
        if (disasterLocation && disasterType && date) {
            // Use Chainlink verification
            result = await registerDisaster(disasterId, disasterName, uploadDir);
            
            // Request verification (non-blocking)
            requestDisasterVerification(disasterId, disasterLocation, disasterType, date)
                .then(verification => {
                    console.log(`Verification requested for disaster ${disasterId}:`, verification);
                })
                .catch(error => {
                    console.error(`Verification request failed for disaster ${disasterId}:`, error);
                });
        } else {
            // Register without verification
            result = await registerDisaster(disasterId, disasterName, uploadDir);
        }
        
        // Cleanup temporary files after successful upload
        fs.rmSync(uploadDir, { recursive: true, force: true });
        
        res.json({
            success: true,
            message: 'Disaster registered successfully',
            data: result
        });
    } catch (error) {
        console.error('Error registering disaster:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to register disaster',
            error: error.message
        });
    }
});

// Get disaster verification status
app.get('/api/disaster/verification/:disasterId', async (req, res) => {
    try {
        const { disasterId } = req.params;
        
        if (!disasterId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing disaster ID' 
            });
        }
        
        // Check verification status
        const result = await checkDisasterVerificationByDisasterId(disasterId);
        
        res.json({
            success: true,
            message: 'Verification status retrieved',
            data: result
        });
    } catch (error) {
        console.error('Error checking verification:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Failed to check verification status',
            error: error.message
        });
    }
});

// API endpoint for contract addresses
app.get('/api/contract-addresses', (req, res) => {
    try {
        const addresses = getContractAddresses();
        
        // Check if we have valid addresses
        const hasValidAddresses = Object.values(addresses).every(addr => 
            addr && addr !== '0x0000000000000000000000000000000000000000' && !addr.includes('0x123')
        );
        
        if (hasValidAddresses) {
            res.json({
                success: true,
                message: 'Contract addresses retrieved successfully',
                data: addresses
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'Contract addresses not properly configured'
            });
        }
    } catch (error) {
        console.error('Error retrieving contract addresses:', error);
        res.status(500).json({
            success: false,
            message: 'Error retrieving contract addresses',
            error: error.message
        });
    }
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
