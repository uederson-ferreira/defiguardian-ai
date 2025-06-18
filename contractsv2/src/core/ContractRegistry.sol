// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/core/ContractRegistry.sol

import "@openzeppelin/contracts/access/Ownable.sol";

contract ContractRegistry is Ownable {
    mapping(bytes32 => address) public contracts;

    event ContractUpdated(bytes32 indexed contractName, address newAddress);

    constructor() Ownable(msg.sender) {}

    function setContract(bytes32 contractName, address contractAddress) external onlyOwner {
        require(contractAddress != address(0), "Invalid address");
        contracts[contractName] = contractAddress;
        emit ContractUpdated(contractName, contractAddress);
    }

    function getContract(bytes32 contractName) external view returns (address) {
        address contractAddress = contracts[contractName];
        require(contractAddress != address(0), "Contract not registered");
        return contractAddress;
    }
}