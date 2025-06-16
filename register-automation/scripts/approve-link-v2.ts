import { ethers } from "hardhat";

async function main() {
  try {
    console.log("🚀 Iniciando aprovação de LINK...");

    const [signer] = await ethers.getSigners();
    console.log("📝 Usando conta:", signer.address);

    // Endereços
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    
    // Quantidade de LINK (0.15)
    const LINK_AMOUNT = ethers.parseEther("0.15");

    // Obtém o contrato LINK
    console.log("📄 Obtendo contrato LINK...");
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);

    // Verifica saldo
    const balance = await linkContract.balanceOf(signer.address);
    console.log("\n💰 Saldo LINK:", ethers.formatEther(balance));

    if (balance < LINK_AMOUNT) {
      throw new Error("Saldo LINK insuficiente");
    }

    // Verifica allowance atual
    const currentAllowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    console.log("🔍 Allowance atual:", ethers.formatEther(currentAllowance));

    // Aprova o Registry
    console.log("\n✍️  Aprovando LINK para o Registry...");
    const tx = await linkContract.approve(REGISTRY_ADDRESS, LINK_AMOUNT, {
      gasLimit: 100000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    });
    
    console.log("📤 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");
    
    await tx.wait();
    console.log("✅ LINK aprovado com sucesso!");
    
    // Verifica nova allowance
    const newAllowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    console.log("\n🔍 Nova allowance:", ethers.formatEther(newAllowance));

  } catch (error) {
    console.error("\n❌ Erro ao aprovar LINK:");
    console.error(error);
    process.exit(1);
  }
}

main(); 