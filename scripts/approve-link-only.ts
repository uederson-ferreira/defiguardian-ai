import { ethers } from "hardhat";

async function main() {
  try {
    // Endereços na Sepolia
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    console.log("🔑 Iniciando aprovação de LINK...");

    // Obtendo a conta
    const [signer] = await ethers.getSigners();
    console.log("📝 Sua conta:", signer.address);

    // Contrato LINK
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);

    // Verificando saldo atual
    const balance = await linkContract.balanceOf(signer.address);
    console.log("💰 Seu saldo LINK:", ethers.formatEther(balance));

    // Aprovando um valor bem alto (100 LINK) para garantir
    console.log("⚡ Enviando aprovação de 100 LINK com gás alto...");
    
    const tx = await linkContract.approve(
      REGISTRY_ADDRESS, 
      ethers.parseEther("100"),
      {
        gasLimit: 500000,
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
      }
    );

    console.log("📤 TX Hash:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("✅ APROVAÇÃO ENVIADA! Verifique a transação no explorer.");

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main(); 