import { ethers } from "hardhat";

async function main() {
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const WALLET_ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";

  // LINK Token ABI (apenas a função balanceOf que precisamos)
  const LINK_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)"
  ];

  // Conecta ao contrato LINK
  const linkContract = await ethers.getContractAt(LINK_ABI, LINK_ADDRESS);
  
  // Obtém o saldo e decimais
  const balance = await linkContract.balanceOf(WALLET_ADDRESS);
  const decimals = await linkContract.decimals();
  
  // Converte para um número legível
  const balanceInLink = ethers.utils.formatUnits(balance, decimals);
  
  console.log(`\nSaldo de LINK na carteira ${WALLET_ADDRESS}:`);
  console.log(`${balanceInLink} LINK\n`);

  // Verifica saldo de ETH também
  const ethBalance = await ethers.provider.getBalance(WALLET_ADDRESS);
  const ethBalanceInEth = ethers.utils.formatEther(ethBalance);
  
  console.log(`Saldo de ETH:`);
  console.log(`${ethBalanceInEth} ETH\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 