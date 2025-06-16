import { ethers } from "hardhat";
import "@chainlink/contracts/src/v0.8/automation/AutomationCompatible.sol";

async function main() {
  try {
    console.log("Iniciando registro no Chainlink Automation...");

    const [signer] = await ethers.getSigners();
    console.log("Usando conta:", signer.address);

    // Endereço do Registry do Chainlink Automation na Sepolia
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    
    // Endereço do seu contrato HedgeAutomation
    const HEDGE_AUTOMATION_ADDRESS = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    // Verificando saldo LINK
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
    const linkBalance = await linkContract.balanceOf(signer.address);
    console.log("Saldo LINK:", ethers.formatEther(linkBalance));

    // Verificando allowance atual
    const allowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    console.log("Allowance atual:", ethers.formatEther(allowance));

    // Obtendo contrato do Registry
    console.log("Obtendo contrato do Registry...");
    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY_ADDRESS);

    // Parâmetros de registro
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
      amount: ethers.parseEther("0.1")
    };

    console.log("Registrando Upkeep com os seguintes parâmetros:");
    console.log("Nome:", registrationParams.name);
    console.log("Contrato:", registrationParams.upkeepContract);
    console.log("Gas Limit:", registrationParams.gasLimit);
    console.log("Admin:", registrationParams.adminAddress);
    console.log("Trigger Type:", registrationParams.triggerType);
    console.log("Quantidade LINK:", ethers.formatEther(registrationParams.amount));

    // Enviando transação com gás mais alto
    console.log("Enviando transação...");
    const tx = await registry.registerUpkeep(registrationParams, {
      gasLimit: 1000000,
      maxFeePerGas: ethers.parseUnits("50", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("2", "gwei")
    });

    console.log("Transação enviada:", tx.hash);
    console.log("Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("Transação confirmada no bloco:", receipt.blockNumber);

    // Obtendo o ID do Upkeep registrado
    const upkeepID = receipt.logs[0].topics[1];
    console.log("Upkeep registrado com ID:", upkeepID);

  } catch (error) {
    console.error("Erro ao registrar Upkeep:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 