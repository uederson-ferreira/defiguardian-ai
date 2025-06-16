import { ethers } from "hardhat";

async function main() {
  try {
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY);

    console.log("⚡ Registrando Upkeep...");
    
    const tx = await registry.registerUpkeep({
      name: "RiskGuardian Automation",
      encryptedEmail: ethers.toUtf8Bytes(""),
      upkeepContract: HEDGE_AUTOMATION,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: ethers.toUtf8Bytes(""),
      triggerConfig: ethers.toUtf8Bytes(""),
      offchainConfig: ethers.toUtf8Bytes(""),
      amount: ethers.parseEther("1")
    }, {
      gasLimit: 2000000,
      maxFeePerGas: ethers.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("5", "gwei")
    });

    console.log("🚀 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("✅ Transação confirmada!");
    
    const upkeepID = receipt.logs[0].topics[1];
    console.log("🎉 Upkeep registrado com ID:", upkeepID);

  } catch (error) {
    console.error("❌ Erro ao registrar Upkeep:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
