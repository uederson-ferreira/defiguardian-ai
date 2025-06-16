import { ethers } from "hardhat";
import type { HedgeAutomation, IERC20 } from "../../typechain-types";

// Função para validar o contrato
export async function validateContract(contract: HedgeAutomation): Promise<boolean> {
  try {
    // Verifica se o contrato implementa as funções necessárias
    const checkUpkeepABI = contract.interface.getFunction("checkUpkeep");
    const performUpkeepABI = contract.interface.getFunction("performUpkeep");
    
    if (!checkUpkeepABI || !performUpkeepABI) {
      console.error("❌ Contrato não implementa as funções necessárias");
      return false;
    }

    // Testa checkUpkeep
    console.log("🔍 Testando checkUpkeep...");
    const { upkeepNeeded } = await contract.checkUpkeep.staticCall("0x");
    console.log("✓ checkUpkeep retornou:", upkeepNeeded);

    return true;
  } catch (error) {
    console.error("❌ Erro ao validar contrato:", error);
    return false;
  }
}

// Função para verificar saldo LINK
export async function checkLinkBalance(
  linkContract: IERC20,
  account: ethers.Signer,
  requiredAmount: bigint
): Promise<boolean> {
  try {
    const address = await account.getAddress();
    const balance = await linkContract.balanceOf(address);
    console.log("💰 Saldo LINK:", ethers.formatEther(balance));
    
    if (balance < requiredAmount) {
      console.error(`❌ Saldo LINK insuficiente. Necessário: ${ethers.formatEther(requiredAmount)} LINK`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar saldo LINK:", error);
    return false;
  }
}

// Função para verificar allowance
export async function checkAllowance(
  linkContract: IERC20,
  account: ethers.Signer,
  spender: string,
  requiredAmount: bigint
): Promise<boolean> {
  try {
    const address = await account.getAddress();
    const allowance = await linkContract.allowance(address, spender);
    console.log("🔓 Allowance atual:", ethers.formatEther(allowance));
    
    if (allowance < requiredAmount) {
      console.error(`❌ Allowance insuficiente. Necessário: ${ethers.formatEther(requiredAmount)} LINK`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar allowance:", error);
    return false;
  }
}

// Função para monitorar eventos do contrato
export async function monitorUpkeepEvents(
  registry: any,
  upkeepID: bigint,
  blocks: number = 5
): Promise<void> {
  try {
    console.log(`\n📡 Monitorando eventos do Upkeep ${upkeepID} por ${blocks} blocos...`);
    
    const provider = ethers.provider;
    const currentBlock = await provider.getBlockNumber();
    
    // Monitora os próximos blocos
    for (let i = 0; i < blocks; i++) {
      const blockNumber = currentBlock + i;
      await provider.getBlock(blockNumber);
      
      // Obtém informações do Upkeep
      const upkeepInfo = await registry.getUpkeep(upkeepID);
      console.log(`\nBloco ${blockNumber}:`);
      console.log("Status:", upkeepInfo.paused ? "Pausado" : "Ativo");
      console.log("Saldo:", ethers.formatEther(upkeepInfo.balance), "LINK");
      console.log("Último bloco executado:", upkeepInfo.lastPerformBlockNumber.toString());
      console.log("Gas gasto:", ethers.formatEther(upkeepInfo.amountSpent), "LINK");
      
      // Pequena pausa entre as verificações
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  } catch (error) {
    console.error("❌ Erro ao monitorar eventos:", error);
  }
}

// Função para verificar status no Etherscan
export async function verifyEtherscanStatus(txHash: string): Promise<void> {
  try {
    console.log(`\n🔍 Verificando status no Etherscan...`);
    console.log(`📋 Link: https://sepolia.etherscan.io/tx/${txHash}`);
    
    const provider = ethers.provider;
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt) {
      console.log("✅ Status:", receipt.status === 1 ? "Sucesso" : "Falha");
      console.log("⛽ Gas usado:", receipt.gasUsed.toString());
      console.log("🔢 Bloco:", receipt.blockNumber);
    } else {
      console.log("⏳ Transação pendente...");
    }
  } catch (error) {
    console.error("❌ Erro ao verificar status no Etherscan:", error);
  }
}

// Função para verificar nonce e gas
export async function checkNonceAndGas(): Promise<{
  nonce: number;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
}> {
  const provider = ethers.provider;
  const [signer] = await ethers.getSigners();
  
  // Obtém o nonce atual
  const nonce = await signer.getNonce();
  
  // Obtém os preços de gas atuais
  const feeData = await provider.getFeeData();
  const maxFeePerGas = feeData.maxFeePerGas || ethers.parseUnits("50", "gwei");
  const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || ethers.parseUnits("2", "gwei");
  
  console.log("\n⛽ Informações de Gas:");
  console.log("Nonce:", nonce);
  console.log("Max Fee:", ethers.formatUnits(maxFeePerGas, "gwei"), "gwei");
  console.log("Priority Fee:", ethers.formatUnits(maxPriorityFeePerGas, "gwei"), "gwei");
  
  return {
    nonce,
    maxFeePerGas,
    maxPriorityFeePerGas
  };
} 