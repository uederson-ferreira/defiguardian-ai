import { ethers } from "hardhat";

async function main() {
  try {
    const [signer] = await ethers.getSigners();
    
    // Endereço do contrato LINK na Sepolia
    const linkAddress = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    
    // Endereço do Registry do Chainlink Automation
    const registryAddress = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    
    // Quantidade de LINK a ser aprovada (0.1 LINK)
    const amount = ethers.parseUnits("0.1", 18);

    console.log("Obtendo nonce atual...");
    const nonce = await signer.getNonce();
    console.log(`Nonce atual: ${nonce}`);
    
    console.log("Aprovando LINK para o Registry...");
    const linkContract = await ethers.getContractAt("IERC20", linkAddress);
    
    const tx = await linkContract.approve(registryAddress, amount, {
      nonce: nonce,
      gasLimit: 100000 // Definindo um limite de gas explícito
    });
    
    console.log(`Transação enviada: ${tx.hash}`);
    console.log("Aguardando confirmação...");
    
    await tx.wait();
    console.log("Aprovação concluída com sucesso!");
    
    // Verifica a allowance
    const allowance = await linkContract.allowance(signer.address, registryAddress);
    console.log(`Allowance atual: ${ethers.formatEther(allowance)} LINK`);

  } catch (error) {
    console.error("Erro ao aprovar LINK:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 