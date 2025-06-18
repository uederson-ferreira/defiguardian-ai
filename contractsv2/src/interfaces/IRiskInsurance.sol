// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ========== IRiskInsurance.sol ==========
interface IRiskInsurance {
    struct InsurancePolicy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 riskThreshold;
        uint256 startTime;
        uint256 duration;
        bool isActive;
        bool hasClaimed;
    }

    function createPolicy(uint256 _coverageAmount, uint256 _riskThreshold, uint256 _duration) external payable;
    function claimInsurance(uint256 _policyId) external;
    function getUserPolicies(address _user) external view returns (uint256[] memory);
}