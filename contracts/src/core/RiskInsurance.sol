// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./PortfolioRiskAnalyzer.sol";

/**
 * @title RiskInsurance
 * @dev Simple insurance contract for high-risk positions
 */
contract RiskInsurance is Ownable(msg.sender), ReentrancyGuard, Pausable {
    PortfolioRiskAnalyzer public immutable portfolioAnalyzer;
    
    struct InsurancePolicy {
        address holder;
        uint256 coverageAmount;
        uint256 premium;
        uint256 riskThreshold;      // Risk level that triggers payout
        uint256 startTime;
        uint256 duration;           // Policy duration in seconds
        bool isActive;
        bool hasClaimed;
    }

    mapping(uint256 => InsurancePolicy) public policies;
    mapping(address => uint256[]) public userPolicies;
    uint256 public nextPolicyId = 1;
    
    uint256 public totalPremiums;
    uint256 public totalClaims;
    uint256 public insurancePool;

    event PolicyCreated(uint256 indexed policyId, address indexed holder, uint256 coverageAmount);
    event ClaimPaid(uint256 indexed policyId, address indexed holder, uint256 amount);
    event PremiumCollected(uint256 indexed policyId, uint256 amount);

    constructor(address _portfolioAnalyzer) {
        portfolioAnalyzer = PortfolioRiskAnalyzer(_portfolioAnalyzer);
    }

    /**
     * @dev Create an insurance policy
     */
    function createPolicy(
        uint256 _coverageAmount,
        uint256 _riskThreshold,
        uint256 _duration
    ) external payable nonReentrant whenNotPaused {
        require(_coverageAmount > 0, "Coverage amount must be positive");
        require(_riskThreshold <= 10000, "Risk threshold too high");
        require(_duration >= 1 days && _duration <= 365 days, "Invalid duration");
        
        // Calculate premium (simplified: 1% of coverage + risk-based adjustment)
        uint256 basePremium = _coverageAmount / 100;
        uint256 riskAdjustment = (basePremium * _riskThreshold) / 10000;
        uint256 premium = basePremium + riskAdjustment;
        
        require(msg.value >= premium, "Insufficient premium payment");

        policies[nextPolicyId] = InsurancePolicy({
            holder: msg.sender,
            coverageAmount: _coverageAmount,
            premium: premium,
            riskThreshold: _riskThreshold,
            startTime: block.timestamp,
            duration: _duration,
            isActive: true,
            hasClaimed: false
        });

        userPolicies[msg.sender].push(nextPolicyId);
        
        totalPremiums += premium;
        insurancePool += premium;

        emit PolicyCreated(nextPolicyId, msg.sender, _coverageAmount);
        emit PremiumCollected(nextPolicyId, premium);

        // Refund excess payment
        if (msg.value > premium) {
            payable(msg.sender).transfer(msg.value - premium);
        }

        nextPolicyId++;
    }

    /**
     * @dev Claim insurance payout if risk threshold exceeded
     */
    function claimInsurance(uint256 _policyId) external nonReentrant whenNotPaused {
        InsurancePolicy storage policy = policies[_policyId];
        
        require(policy.holder == msg.sender, "Not policy holder");
        require(policy.isActive, "Policy not active");
        require(!policy.hasClaimed, "Already claimed");
        require(block.timestamp <= policy.startTime + policy.duration, "Policy expired");

        // Check current portfolio risk
        PortfolioRiskAnalyzer.PortfolioAnalysis memory analysis = portfolioAnalyzer.getPortfolioAnalysis(msg.sender);
        require(analysis.isValid, "No valid portfolio analysis");
        require(analysis.overallRisk >= policy.riskThreshold, "Risk threshold not exceeded");

        // Calculate payout based on risk level vs threshold
        uint256 riskExcess = analysis.overallRisk - policy.riskThreshold;
        uint256 payoutRatio = (riskExcess * 10000) / (10000 - policy.riskThreshold);
        if (payoutRatio > 10000) payoutRatio = 10000; // Cap at 100%
        
        uint256 payout = (policy.coverageAmount * payoutRatio) / 10000;
        require(payout <= insurancePool, "Insufficient insurance pool");

        policy.hasClaimed = true;
        policy.isActive = false;
        
        totalClaims += payout;
        insurancePool -= payout;

        payable(msg.sender).transfer(payout);

        emit ClaimPaid(_policyId, msg.sender, payout);
    }

    /**
     * @dev Get user's policies
     */
    function getUserPolicies(address _user) external view returns (uint256[] memory) {
        return userPolicies[_user];
    }

    /**
     * @dev Owner can withdraw excess premiums (simple treasury function)
     */
    function withdrawExcess(uint256 _amount) external onlyOwner whenNotPaused {
        require(_amount <= insurancePool, "Cannot withdraw more than pool");
        require(insurancePool - _amount >= totalClaims, "Must maintain claims reserve");
        
        insurancePool -= _amount;
        payable(owner()).transfer(_amount);
    }

    /**
     * @dev Add funds to insurance pool
     */
    function addToPool() external payable whenNotPaused {
        insurancePool += msg.value;
    }

    /**
     * @dev Emergency pause
     */
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}