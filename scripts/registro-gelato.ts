import { ethers } from "hardhat";
import {
  AutomateSDK,
  TriggerType,
} from "@gelatonetwork/automate-sdk";

async function main() {
  try {
    // Endereço do contrato
    const HEDGE_AUTOMATION = "0xF19B115b906a7B085b04944A1c53017Bb6B4c92a";
    
    // Obtém o signer
    const [signer] = await ethers.getSigners();
    console.log("🔑 Conta:", signer.address);

    // Inicializa o SDK do Gelato (Sepolia = 11155111)
    const automate = new AutomateSDK(11155111, signer);
    console.log("✅ Gelato SDK inicializado");

    // Interface do contrato
    const contractInterface = new ethers.Interface([
      "function checkUpkeep(bytes) external returns (bool, bytes)",
      "function performUpkeep(bytes) external",
    ]);

    // Cria a task
    console.log("🚀 Criando task no Gelato...");
    const { taskId, tx } = await automate.createTask({
      name: "RiskGuardian Hedge Automation",
      execAddress: HEDGE_AUTOMATION,
      execSelector: contractInterface.getFunction("performUpkeep").selector,
      dedicatedMsgSender: true,
      trigger: {
        type: TriggerType.TIME,
        interval: 300, // 5 minutos
      },
      resolverAddress: HEDGE_AUTOMATION,
      resolverData: contractInterface.encodeFunctionData("checkUpkeep", ["0x"]),
    });

    console.log("📤 Transação enviada:", tx.hash);
    console.log("🔗 Acompanhe em: https://sepolia.etherscan.io/tx/" + tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    
    if (receipt.status === 1) {
      console.log("🎉 Task criada com sucesso!");
      console.log("📝 Task ID:", taskId);
      console.log("\n🔍 Próximos passos:");
      console.log("1. Verifique a task em: https://app.gelato.network/task/" + taskId);
      console.log("2. Monitore as execuções");
      console.log("3. Ajuste o intervalo se necessário");
    } else {
      throw new Error("Transação falhou! Verifique no Etherscan.");
    }

  } catch (error) {
    console.error("❌ Erro ao criar task:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 