import { ethers } from "hardhat";

async function main() {
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const HEDGE_CONTRACT = "0x36984C5c68612Ce06C547B587D867EE096A7469c";
  
  // LINK Token ABI (apenas as funções que precisamos)
  const LINK_ABI = [
    "function transfer(address to, uint256 amount) returns (bool)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  console.log("\nTransferindo LINK tokens para o contrato...");
  
  // Conecta ao contrato LINK
  const linkContract = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);
  
  // Transfere 1 LINK para o contrato
  const amount = ethers.utils.parseUnits("1", 18);
  console.log(`\nTransferindo ${ethers.utils.formatUnits(amount, 18)} LINK...`);
  
  const tx = await linkContract.transfer(HEDGE_CONTRACT, amount);
  console.log("Aguardando confirmação...");
  await tx.wait();
  
  // Verifica o novo saldo
  const balance = await linkContract.balanceOf(HEDGE_CONTRACT);
  console.log(`\nTransferência concluída!`);
  console.log(`Novo saldo do contrato: ${ethers.utils.formatUnits(balance, 18)} LINK\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 