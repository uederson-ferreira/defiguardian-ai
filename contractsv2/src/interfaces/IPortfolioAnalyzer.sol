// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

// ========== IPortfolioAnalyzer.sol ==========
interface IPortfolioAnalyzer {
    struct Position {
        address protocol;
        address token;
        uint256 amount;
        uint256 value;
    }

    struct PortfolioAnalysis {
        uint256 totalValue;
        uint256 overallRisk;
        uint256 diversificationScore;
        uint256 timestamp;
        bool isValid;
    }
    function riskRegistry() external view returns (address);
    
    function addPosition(address _protocol, address _token, uint256 _amount) external;
    function removePosition(uint256 _positionIndex) external;
    function calculatePortfolioRisk(address _user) external view returns (uint256);
    function getPortfolioAnalysis(address _user) external view returns (PortfolioAnalysis memory);
    function getUserPositions(address _user) external view returns (Position[] memory);
}

