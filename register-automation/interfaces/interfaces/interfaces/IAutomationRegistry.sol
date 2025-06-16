// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAutomationRegistry {
    function registerUpkeep(
        struct {
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
        } calldata params
    ) external returns (uint256);
}
