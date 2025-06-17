import { ethers } from "hardhat";

async function main() {
  // Endereço do contrato CrossChainHedge deployado anteriormente
  const CROSS_CHAIN_HEDGE_ADDRESS = "0x48bf25066a6A0bc9c8d4a749b130B0eC9F8016d7";

  console.log("Deploying HedgeAutomation...");
  
  const HedgeAutomation = await ethers.getContractFactory("HedgeAutomation");
  const automation = await HedgeAutomation.deploy(CROSS_CHAIN_HEDGE_ADDRESS);
  
  await automation.deployed();
  
  console.log(`HedgeAutomation deployed to: ${automation.address}`);
  console.log(`CrossChainHedge Address: ${CROSS_CHAIN_HEDGE_ADDRESS}`);
  
  // Aguarda um pouco para a rede confirmar o contrato
  await new Promise(resolve => setTimeout(resolve, 30000));
  
  // Verifica o contrato no Etherscan
  console.log("\nVerifying contract on Etherscan...");
  await hre.run("verify:verify", {
    address: automation.address,
    constructorArguments: [CROSS_CHAIN_HEDGE_ADDRESS],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 