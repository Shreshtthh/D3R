const { expect } = require('chai');
const sinon = require('sinon');
const path = require('path');
const fs = require('fs');

// Modules to test
const { 
    uploadDirectoryToPinata,
    getIPFSUrl 
} = require('../upload');

const {
    registerNGO,
    submitMilestoneProof,
    registerDisaster,
    requestDisasterVerification
} = require('../contract-integration');

// Mock ethers
const mockEthers = {
    providers: {
        JsonRpcProvider: function() {
            return {
                // Mock provider methods
            };
        }
    },
    Wallet: function() {
        return {
            // Mock wallet methods
        };
    },
    Contract: function() {
        return {
            registerNGO: sinon.stub().resolves({
                hash: '0xmocktxhash123'
            }),
            submitProof: sinon.stub().resolves({
                hash: '0xmocktxhash456'
            }),
            registerDisaster: sinon.stub().resolves({
                hash: '0xmocktxhash789'
            }),
            requestDisasterVerification: sinon.stub().resolves({
                hash: '0xmocktxhash101'
            }),
            wait: sinon.stub().resolves({}),
            // Add more contract method mocks as needed
        };
    }
};

// Mock data
const mockIPFSResult = {
    IpfsHash: 'QmTestHash123',
    PinSize: 1000,
    Timestamp: new Date().toISOString()
};

describe('Contract Integration', function() {
    let ethersStub;
    let uploadStub;
    
    before(function() {
        // Stub the modules
        ethersStub = sinon.stub(require('ethers'), 'ethers').value(mockEthers);
        uploadStub = sinon.stub(require('../upload'), 'uploadDirectoryToPinata').resolves(mockIPFSResult);
    });
    
    after(function() {
        // Restore original modules
        ethersStub.restore();
        uploadStub.restore();
    });
    
    describe('NGO Registration', function() {
        it('should register an NGO successfully', async function() {
            const result = await registerNGO('test-ngo', 'Test NGO', '/fake/path');
            
            expect(result).to.have.property('ngoId', 'test-ngo');
            expect(result).to.have.property('documentsCID', 'QmTestHash123');
            expect(result).to.have.property('txHash', '0xmocktxhash123');
        });
    });
    
    describe('Milestone Proof Submission', function() {
        it('should submit milestone proof successfully', async function() {
            const result = await submitMilestoneProof('project-1', 1, '/fake/path');
            
            expect(result).to.have.property('projectId', 'project-1');
            expect(result).to.have.property('milestoneNumber', 1);
            expect(result).to.have.property('proofCID', 'QmTestHash123');
            expect(result).to.have.property('txHash', '0xmocktxhash456');
        });
    });
    
    describe('Disaster Registration', function() {
        it('should register a disaster successfully', async function() {
            const result = await registerDisaster('disaster-1', 'Test Disaster', '/fake/path');
            
            expect(result).to.have.property('disasterId', 'disaster-1');
            expect(result).to.have.property('evidenceCID', 'QmTestHash123');
            expect(result).to.have.property('txHash', '0xmocktxhash789');
        });
    });
    
    describe('Chainlink Verification', function() {
        it('should request disaster verification successfully', async function() {
            // Mock the event in the receipt
            mockEthers.Contract().requestDisasterVerification.resolves({
                hash: '0xmocktxhash101',
                wait: () => ({
                    events: [
                        {
                            event: 'DisasterVerificationRequested',
                            args: {
                                requestId: '0xtestrequestid123'
                            }
                        }
                    ]
                })
            });
            
            const result = await requestDisasterVerification(
                'disaster-1', 
                '40.7128,-74.0060', 
                'hurricane',
                '2023-09-01'
            );
            
            expect(result).to.have.property('requestId', '0xtestrequestid123');
            expect(result).to.have.property('txHash', '0xmocktxhash101');
        });
    });
});
