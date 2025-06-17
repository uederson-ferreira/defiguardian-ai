import { ethers } from "hardhat";

async function main() {
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const HEDGE_CONTRACT = "0x36984C5c68612Ce06C547B587D867EE096A7469c";
  
  // LINK Token ABI (apenas as funções que precisamos)
  const LINK_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  console.log("\nVerificando aprovações do LINK token...");
  
  // Conecta ao contrato LINK
  const linkContract = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);
  const [signer] = await ethers.getSigners();
  
  // Verifica saldo do usuário
  const balance = await linkContract.balanceOf(signer.address);
  console.log(`\nSaldo do usuário: ${ethers.utils.formatUnits(balance, 18)} LINK`);
  
  // Verifica aprovação para o contrato
  const allowance = await linkContract.allowance(signer.address, HEDGE_CONTRACT);
  console.log(`\nAprovação para o contrato: ${ethers.utils.formatUnits(allowance, 18)} LINK`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 