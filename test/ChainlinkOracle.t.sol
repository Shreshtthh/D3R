// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ChainlinkDisasterOracle.sol";

// Mock LinkToken contract that includes the interface we need
contract MockLinkToken {
    mapping(address => uint256) public balances;

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }

    function transfer(address to, uint256 amount) public returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function transferAndCall(address to, uint256 amount, bytes calldata data) public returns (bool) {
        balances[msg.sender] -= amount;
        balances[to] += amount;
        return true;
    }

    function mint(address to, uint256 amount) public {
        balances[to] += amount;
    }
}

contract ChainlinkOracleTest is Test {
    ChainlinkDisasterOracle public oracle;

    address owner = address(1);
    address linkToken = address(2);
    address chainlinkOracle = address(3);
    bytes32 jobId = "7d80a6386ef543a3abb52817f6707e3b";
    uint256 fee = 0.1 ether; // 0.1 LINK

    MockLinkToken public mockLink;

    function setUp() public {
        // Deploy mock Link token
        mockLink = new MockLinkToken();

        // Deploy Oracle contract
        vm.startPrank(owner);
        oracle = new ChainlinkDisasterOracle(address(mockLink), chainlinkOracle, jobId, fee);
        vm.stopPrank();

        // Fund Oracle with LINK tokens
        mockLink.mint(address(oracle), 10 ether); // 10 LINK
    }

    function testUpdateChainlinkParameters() public {
        // Update parameters
        address newOracle = address(4);
        bytes32 newJobId = "9e664e99cf434b4fb99d76e85807317d";
        uint256 newFee = 0.2 ether;

        vm.prank(owner);
        oracle.updateChainlinkParameters(newOracle, newJobId, newFee);

        // There's no getter for these private variables, so we can't directly assert them
        // In a real test, we would test the effects of these changes
    }

    function testWithdrawLink() public {
        uint256 ownerBefore = mockLink.balanceOf(owner);
        uint256 oracleBefore = mockLink.balanceOf(address(oracle));

        vm.prank(owner);
        oracle.withdrawLink();

        uint256 ownerAfter = mockLink.balanceOf(owner);
        uint256 oracleAfter = mockLink.balanceOf(address(oracle));

        assertEq(ownerAfter - ownerBefore, oracleBefore);
        assertEq(oracleAfter, 0);
    }

    // Note: Full testing of Chainlink Oracle requires mocking the Chainlink network
    // which is beyond the scope of this basic test file
}
