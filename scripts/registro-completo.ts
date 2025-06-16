import { ethers } from "hardhat";

async function main() {
  try {
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Obtendo o nonce atual
    const nonce = await signer.getNonce();
    console.log("🔢 Nonce atual:", nonce);

    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY);

    // Configuração com gas price threshold
    const offchainConfig = ethers.toUtf8Bytes(JSON.stringify({
      maxGasPrice: 50000000000 // 50 gwei em wei
    }));

    console.log("⚡ Registrando Upkeep com configurações otimizadas...");
    
    const tx = await registry.registerUpkeep({
      name: "RiskGuardian Automation Final",
      encryptedEmail: ethers.toUtf8Bytes(""),
      upkeepContract: HEDGE_AUTOMATION,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: ethers.toUtf8Bytes(""),
      triggerConfig: ethers.toUtf8Bytes(""),
      offchainConfig: offchainConfig,
      amount: ethers.parseEther("5")
    }, {
      gasLimit: 1500000,
      maxFeePerGas: ethers.parseUnits("30", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei"),
      nonce: nonce // Usando nonce explícito
    });

    console.log("🚀 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação (pode demorar alguns minutos)...");

    // Aumentando o número de confirmações para 2
    const receipt = await tx.wait(2);
    console.log("✅ Transação confirmada com 2 blocos!");
    
    const upkeepID = receipt.logs[0].topics[1];
    console.log("🎉 Upkeep registrado com ID:", upkeepID);
    console.log("🔗 Veja no Explorer: https://sepolia.etherscan.io/tx/" + tx.hash);

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