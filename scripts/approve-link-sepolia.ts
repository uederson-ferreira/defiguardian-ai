import { ethers } from "hardhat";

async function main() {
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const HEDGE_CONTRACT = "0x36984C5c68612Ce06C547B587D867EE096A7469c";
  
  // LINK Token ABI (apenas as funções que precisamos)
  const LINK_ABI = [
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  console.log("\nAprovando LINK tokens para o contrato CrossChainHedge...");
  
  // Conecta ao contrato LINK
  const linkContract = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);
  
  // Aprova um valor alto (100 LINK)
  const amount = ethers.utils.parseUnits("100", 18); // LINK tem 18 decimais
  
  console.log(`\nAprovando ${ethers.utils.formatUnits(amount, 18)} LINK tokens...`);
  const tx = await linkContract.approve(HEDGE_CONTRACT, amount);
  
  console.log("Aguardando confirmação...");
  await tx.wait();
  
  // Verifica a aprovação
  const [deployer] = await ethers.getSigners();
  const allowance = await linkContract.allowance(deployer.address, HEDGE_CONTRACT);
  
  console.log(`\nAprovação concluída!`);
  console.log(`Allowance atual: ${ethers.utils.formatUnits(allowance, 18)} LINK\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 