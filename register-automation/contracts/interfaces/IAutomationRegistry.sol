// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IAutomationRegistry {
    struct RegistrationParams {
        string name;
        bytes encryptedEmail;
        address upkeepContract;
        uint32 gasLimit;
        address adminAddress;
        uint8 triggerType;
        bytes checkData;
        bytes triggerConfig;
        bytes offchainConfig;
        uint96 amount;
    }

    function registerUpkeep(
        RegistrationParams calldata requestParams
    ) external returns (uint256);

    function getUpkeep(uint256 id) external view returns (
        address target,
        uint32 executeGas,
        bytes memory checkData,
        uint96 balance,
        address admin,
        uint64 maxValidBlocknumber,
        uint32 lastPerformBlockNumber,
        uint96 amountSpent,
        bool paused,
        bytes memory offchainConfig
    );
} 