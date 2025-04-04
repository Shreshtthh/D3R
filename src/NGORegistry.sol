// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract NGORegistry is Ownable {
    struct NGO {
        string name;
        string website;
        string contact;
        bool verified;
    }

    mapping(address => NGO) public ngos;
    address[] public verifiedNGOs;
    event NGORegistered(address indexed ngo, string name);
    event NGOVerified(address indexed ngo, bool status);
    event NGOUpdated(address indexed ngo, string name, string website, string contact);

    constructor(address _initialOwner) Ownable(_initialOwner) {}

    function registerNGO(string memory _name, string memory _website, string memory _contact) external {
        require(bytes(ngos[msg.sender].name).length == 0, "NGO already registered");
        ngos[msg.sender] = NGO(_name, _website, _contact, false);
        emit NGORegistered(msg.sender, _name);
    }

    function updateNGOInfo(string memory _name, string memory _website, string memory _contact) external {
        require(bytes(ngos[msg.sender].name).length > 0, "NGO not registered");
        NGO storage ngo = ngos[msg.sender];
        ngo.name = _name;
        ngo.website = _website;
        ngo.contact = _contact;
        emit NGOUpdated(msg.sender, _name, _website, _contact);
    }

    function verifyNGO(address _ngo, bool _status) external onlyOwner {
        require(bytes(ngos[_ngo].name).length > 0, "NGO not registered");
        
        // If verifying and wasn't previously verified, add to verified list
        if (_status && !ngos[_ngo].verified) {
            verifiedNGOs.push(_ngo);
        }
        
        ngos[_ngo].verified = _status;
        emit NGOVerified(_ngo, _status);
    }

    function isVerified(address _ngo) external view returns (bool) {
        return ngos[_ngo].verified;
    }

    function getNGODetails(address _ngo) external view returns (NGO memory) {
        require(bytes(ngos[_ngo].name).length > 0, "NGO not registered");
        return ngos[_ngo];
    }
    
    function getVerifiedNGOsCount() external view returns (uint256) {
        return verifiedNGOs.length;
    }
}
