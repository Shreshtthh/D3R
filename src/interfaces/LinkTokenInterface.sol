// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface LinkTokenInterface {
    function transferAndCall(address to, uint256 amount, bytes calldata data) external returns (bool success);
    function transfer(address to, uint256 value) external returns (bool success);
    function balanceOf(address owner) external view returns (uint256 balance);
}
