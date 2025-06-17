import { ethers } from "hardhat";

async function main() {
  console.log("\nDeployando CrossChainHedge na rede Sepolia...");
  
  // Endereços do CCIP na Sepolia
  const CCIP_ROUTER = "0xD0daae2231E9CB96b94C8512223533293C3693Bf"; // Router CCIP na Sepolia
  const LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // LINK Token na Sepolia
  
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);

  // Deploy do contrato CrossChainHedge
  const CrossChainHedge = await ethers.getContractFactory("CrossChainHedge");
  const crossChainHedge = await CrossChainHedge.deploy(
    CCIP_ROUTER,
    LINK_TOKEN
  );

  await crossChainHedge.deployed();

  console.log("\nCrossChainHedge deployado com sucesso!");
  console.log("Endereço:", crossChainHedge.address);
  console.log("\nVerifique o contrato em: https://sepolia.etherscan.io/address/" + crossChainHedge.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 