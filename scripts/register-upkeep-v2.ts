import { ethers } from "hardhat";
import { Log } from "@ethersproject/abstract-provider";

async function main() {
  try {
    // Endereços na Sepolia
    const REGISTRAR = "0x9A811502d843E5a03913d5A2cfb646c11463467A"; // Registrar 2.1
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Interface do Registrar 2.1
    const registrar = await ethers.getContractAt("IAutomationRegistrar2_1", REGISTRAR);
    
    console.log("⚡ Registrando Upkeep via Registrar 2.1...");
    
    const registrationParams = {
      name: "RiskGuardian Automation V2",
      encryptedEmail: [],
      upkeepContract: HEDGE_AUTOMATION,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: "0x",
      triggerConfig: "0x",
      offchainConfig: "0x",
      amount: ethers.parseEther("0.1")
    };

    const tx = await registrar.register(
      registrationParams.name,
      registrationParams.encryptedEmail,
      registrationParams.upkeepContract,
      registrationParams.gasLimit,
      registrationParams.adminAddress,
      registrationParams.triggerType,
      registrationParams.checkData,
      registrationParams.triggerConfig,
      registrationParams.offchainConfig,
      {
        value: ethers.parseEther("0.1"),
        gasLimit: 1000000,
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
      }
    );

    console.log("🚀 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("✅ Transação confirmada no bloco:", receipt.blockNumber);

    // Procurando evento de registro
    const registrationEvent = receipt.logs.find(
      (log: Log) => log.topics[0] === ethers.id("UpkeepRegistered(uint256,uint32,address)")
    );

    if (registrationEvent) {
      const upkeepID = registrationEvent.topics[1];
      console.log("🎉 Upkeep registrado com ID:", upkeepID);
    }

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