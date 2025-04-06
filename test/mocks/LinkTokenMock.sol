// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";

contract LinkTokenMock {
    mapping(address => uint256) private balances;
    mapping(address => mapping(address => uint256)) private allowances;

    uint256 private _totalSupply = 1_000_000_000 ether;

    constructor() {
        balances[msg.sender] = _totalSupply;
    }

    function transferAndCall(address to, uint256 amount, bytes calldata data) public returns (bool success) {
        transfer(to, amount);
        // In a real implementation, this would call an onTokenTransfer function
        // For test purposes, we just return true
        return true;
    }

    function transfer(address to, uint256 amount) public returns (bool success) {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function balanceOf(address owner) public view returns (uint256 balance) {
        return balances[owner];
    }

    function approve(address spender, uint256 amount) public returns (bool success) {
        allowances[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) public returns (bool success) {
        require(balances[from] >= amount, "Insufficient balance");
        require(allowances[from][msg.sender] >= amount, "Insufficient allowance");
        balances[from] -= amount;
        balances[to] += amount;
        allowances[from][msg.sender] -= amount;
        return true;
    }
}
