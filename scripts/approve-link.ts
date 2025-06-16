import { ethers } from "hardhat";

async function main() {
  try {
    // Endereço do LINK Token na Sepolia
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    
    // Endereço do Registry do Chainlink Automation
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    
    // Quantidade de LINK a ser aprovada (0.1 LINK)
    const LINK_AMOUNT = ethers.parseEther("0.1");

    // Obtém o contrato LINK
    const LINK = await ethers.getContractAt("IERC20", LINK_ADDRESS);

    // Aprova o Registry para gastar LINK
    console.log("Aprovando LINK para o Registry...");
    const tx = await LINK.approve(REGISTRY_ADDRESS, LINK_AMOUNT);
    
    console.log("Aguardando confirmação...");
    await tx.wait();
    
    console.log("LINK aprovado com sucesso!");
    
    // Verifica a allowance
    const allowance = await LINK.allowance(await LINK.signer.getAddress(), REGISTRY_ADDRESS);
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