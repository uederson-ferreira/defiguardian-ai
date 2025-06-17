import { ethers } from "hardhat";

async function main() {
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const HEDGE_CONTRACT = "0x36984C5c68612Ce06C547B587D867EE096A7469c";
  
  // LINK Token ABI (apenas as funções que precisamos)
  const LINK_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  console.log("\nVerificando saldos de LINK...");
  
  // Conecta ao contrato LINK
  const linkContract = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);
  
  // Verifica saldo do contrato
  const contractBalance = await linkContract.balanceOf(HEDGE_CONTRACT);
  console.log(`\nSaldo do contrato: ${ethers.utils.formatUnits(contractBalance, 18)} LINK`);
  
  // Verifica saldo do deployer
  const [deployer] = await ethers.getSigners();
  const deployerBalance = await linkContract.balanceOf(deployer.address);
  console.log(`Saldo do deployer: ${ethers.utils.formatUnits(deployerBalance, 18)} LINK\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 