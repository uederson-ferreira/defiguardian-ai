// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Script.sol";
import "../src/core/PortfolioRiskAnalyzer.sol";

/**
 * @title CheckOwner
 * @dev Script to check the owner of PortfolioRiskAnalyzer contract
 */
contract CheckOwner is Script {
    address constant PORTFOLIO_ANALYZER = 0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192;
    
    function run() external view {
        PortfolioRiskAnalyzer portfolioAnalyzer = PortfolioRiskAnalyzer(PORTFOLIO_ANALYZER);
        
        console.log("=== CONTRACT OWNERSHIP CHECK ===");
        console.log("Contract Address:", PORTFOLIO_ANALYZER);
        
        address owner = portfolioAnalyzer.owner();
        console.log("Current Owner:", owner);
        
        // Check if the deployer address from .env matches the owner
        address deployerAddress = 0x376aa192A27fE997Ee1b51920D884e00ea8C365A;
        console.log("Deployer Address:", deployerAddress);
        console.log("Is Deployer the Owner?", owner == deployerAddress ? "YES" : "NO");
        
        if (owner != deployerAddress) {
            console.log("\n=== PROBLEM IDENTIFIED ===");
            console.log("The deployer address is NOT the owner of the contract!");
            console.log("This explains why the setPriceFeed transaction failed.");
            console.log("Only the owner can call setPriceFeed function.");
        } else {
            console.log("\n=== OWNERSHIP OK ===");
            console.log("The deployer is the owner. Issue might be elsewhere.");
        }
    }
}