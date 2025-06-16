import { ethers } from "hardhat";
import { Contract } from "ethers";

async function validateContract(contract: Contract) {
  try {
    // Verifica se o contrato implementa a interface corretamente
    await contract.checkUpkeep("0x");
    console.log("✅ checkUpkeep implementado corretamente");
    return true;
  } catch (error) {
    console.error("❌ Erro ao validar checkUpkeep:", error);
    return false;
  }
}

async function checkLinkBalance(linkContract: Contract, signer: any, requiredAmount: bigint) {
  const balance = await linkContract.balanceOf(signer.address);
  console.log("Saldo LINK:", ethers.formatEther(balance));
  
  if (balance < requiredAmount) {
    console.error("❌ Saldo LINK insuficiente");
    return false;
  }
  
  console.log("✅ Saldo LINK suficiente");
  return true;
}

async function checkAllowance(linkContract: Contract, signer: any, registry: string, requiredAmount: bigint) {
  const allowance = await linkContract.allowance(signer.address, registry);
  console.log("Allowance atual:", ethers.formatEther(allowance));
  
  if (allowance < requiredAmount) {
    console.error("❌ Allowance insuficiente");
    return false;
  }
  
  console.log("✅ Allowance suficiente");
  return true;
}

async function main() {
  try {
    console.log("🚀 Iniciando registro no Chainlink Automation v2...");

    const [signer] = await ethers.getSigners();
    console.log("📝 Usando conta:", signer.address);

    // Endereços
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION_ADDRESS = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    // Quantidade de LINK (0.15)
    const LINK_AMOUNT = ethers.parseEther("0.15");

    // Contratos
    console.log("📄 Obtendo contratos...");
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY_ADDRESS);
    const hedgeAutomation = await ethers.getContractAt("HedgeAutomation", HEDGE_AUTOMATION_ADDRESS);

    // Validações
    console.log("\n🔍 Executando validações...");
    
    const isContractValid = await validateContract(hedgeAutomation);
    if (!isContractValid) {
      throw new Error("Contrato inválido");
    }

    const hasBalance = await checkLinkBalance(linkContract, signer, LINK_AMOUNT);
    if (!hasBalance) {
      throw new Error("Saldo LINK insuficiente");
    }

    const hasAllowance = await checkAllowance(linkContract, signer, REGISTRY_ADDRESS, LINK_AMOUNT);
    if (!hasAllowance) {
      throw new Error("Allowance insuficiente");
    }

    // Nonce atual
    const nonce = await signer.getNonce();
    console.log("\n📊 Nonce atual:", nonce);

    // Parâmetros de registro otimizados
    const registrationParams = {
      name: "RiskGuardian Hedge Automation",
      encryptedEmail: ethers.toUtf8Bytes(""),
      upkeepContract: HEDGE_AUTOMATION_ADDRESS,
      gasLimit: 1000000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: ethers.toUtf8Bytes("0x"),
      triggerConfig: ethers.toUtf8Bytes("0x"),
      offchainConfig: ethers.toUtf8Bytes("0x"),
      amount: LINK_AMOUNT
    };

    console.log("\n📝 Parâmetros de registro:");
    console.log("Nome:", registrationParams.name);
    console.log("Contrato:", registrationParams.upkeepContract);
    console.log("Gas Limit:", registrationParams.gasLimit);
    console.log("Admin:", registrationParams.adminAddress);
    console.log("LINK:", ethers.formatEther(registrationParams.amount));

    // Enviando transação com parâmetros otimizados
    console.log("\n🚀 Enviando transação de registro...");
    const tx = await registry.registerUpkeep(registrationParams, {
      gasLimit: 2000000,
      maxFeePerGas: ethers.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("5", "gwei"),
      nonce: nonce
    });

    console.log("📤 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("✅ Transação confirmada no bloco:", receipt.blockNumber);

    // Obtendo o ID do Upkeep
    const upkeepID = receipt.logs[0].topics[1];
    console.log("🎉 Upkeep registrado com sucesso!");
    console.log("📋 ID do Upkeep:", upkeepID);

    // Verificações pós-registro
    console.log("\n🔍 Verificando registro...");
    const upkeepInfo = await registry.getUpkeep(upkeepID);
    console.log("Status:", upkeepInfo.status);
    console.log("Balance:", ethers.formatEther(upkeepInfo.balance));

  } catch (error) {
    console.error("\n❌ Erro durante o registro:");
    console.error(error);
    
    // Log detalhado do erro
    if (error.error) {
      console.error("\nDetalhes do erro:");
      console.error("Code:", error.error.code);
      console.error("Message:", error.error.message);
      console.error("Data:", error.error.data);
    }
    
    process.exit(1);
  }
}

main();