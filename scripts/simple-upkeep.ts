import { ethers } from "hardhat";

async function main() {
  try {
    console.log("🚀 Iniciando registro simplificado no Chainlink Automation...");

    // Obtendo a conta que vai fazer o registro
    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Endereços dos contratos (Sepolia)
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const HEDGE_AUTOMATION_ADDRESS = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    // Verificando saldo LINK
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
    const linkBalance = await linkContract.balanceOf(signer.address);
    
    if (linkBalance < ethers.parseEther("1")) {
      throw new Error("❌ Saldo LINK insuficiente. Necessário pelo menos 1 LINK");
    }
    console.log("💰 Saldo LINK:", ethers.formatEther(linkBalance));

    // Verificando e fazendo approve se necessário
    const allowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    if (allowance < ethers.parseEther("1")) {
      console.log("⚡ Aprovando LINK para o Registry...");
      const approveTx = await linkContract.approve(
        REGISTRY_ADDRESS,
        ethers.parseEther("10")
      );
      await approveTx.wait();
      console.log("✅ LINK aprovado!");
    }

    // Obtendo contrato do Registry
    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY_ADDRESS);

    // Parâmetros simplificados do registro
    const registrationParams = {
      name: "RiskGuardian Hedge Automation",
      encryptedEmail: ethers.toUtf8Bytes(""),
      upkeepContract: HEDGE_AUTOMATION_ADDRESS,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: ethers.toUtf8Bytes(""),
      triggerConfig: ethers.toUtf8Bytes(""),
      offchainConfig: ethers.toUtf8Bytes(""),
      amount: ethers.parseEther("1")
    };

    console.log("📋 Registrando Upkeep...");
    
    // Enviando transação com gás otimizado
    const tx = await registry.registerUpkeep(registrationParams, {
      gasLimit: 1000000
    });

    console.log("📤 TX Hash:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error("❌ Transação falhou!");
    }

    // Obtendo o ID do Upkeep registrado
    const upkeepID = receipt.logs[0].topics[1];
    console.log("🎉 Upkeep registrado com sucesso!");
    console.log("📝 ID do Upkeep:", upkeepID);

  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main(); 