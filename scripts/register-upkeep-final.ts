import { ethers } from "hardhat";

async function main() {
  try {
    // Endereços na Sepolia
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Obtendo contrato do Registry
    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY);

    console.log("⚡ Registrando Upkeep...");
    
    const tx = await registry.registerUpkeep({
      name: "RiskGuardian Automation",
      encryptedEmail: "0x",
      upkeepContract: HEDGE_AUTOMATION,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: "0x",
      triggerConfig: "0x",
      offchainConfig: "0x",
      amount: ethers.parseEther("1")
    });

    console.log("📤 TX Hash:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log("🎉 UPKEEP REGISTRADO COM SUCESSO!");
      
      // Tentando extrair o ID do Upkeep
      if (receipt.logs && receipt.logs.length > 0) {
        const upkeepID = receipt.logs[0].topics[1];
        console.log("📝 ID do Upkeep:", upkeepID);
      }
    } else {
      throw new Error("Transação falhou!");
    }

  } catch (error) {
    console.error("❌ Erro detalhado:", error);
    process.exit(1);
  }
}

main(); 