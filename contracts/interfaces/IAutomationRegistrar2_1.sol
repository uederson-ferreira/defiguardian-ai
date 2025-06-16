// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAutomationRegistrar2_1 {
    function register(
        string memory name,
        bytes calldata encryptedEmail,
        address upkeepContract,
        uint32 gasLimit,
        address adminAddress,
        uint8 triggerType,
        bytes calldata checkData,
        bytes calldata triggerConfig,
        bytes calldata offchainConfig
    ) external payable returns (uint256);
} 