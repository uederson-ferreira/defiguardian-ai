import { ethers, network } from "hardhat";

async function main() {
  // Endereços do CCIP Router e LINK token na Fuji testnet
  const FUJI_ROUTER = "0xF694E193200268f9a4868e4Aa017A0118C9a8177";
  const FUJI_LINK = "0x0b9d5D9136855f6FEc3c0993feE6E9CE8a297846";
  
  console.log(`Deployando CrossChainHedge na rede ${network.name}...`);
  
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);
  
  const CrossChainHedge = await ethers.getContractFactory("CrossChainHedge");
  const hedge = await CrossChainHedge.deploy(FUJI_ROUTER, FUJI_LINK);
  
  await hedge.deployed();
  
  console.log(`CrossChainHedge deployado em: ${hedge.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 