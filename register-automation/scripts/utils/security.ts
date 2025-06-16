import { ethers } from "hardhat";
import type { HedgeAutomation } from "../../typechain-types";

// Função para verificar circuit breakers
export async function checkCircuitBreakers(contract: HedgeAutomation): Promise<boolean> {
  try {
    // Verifica limites de gas
    const gasLimit = await contract.gasLimit();
    if (gasLimit > 2000000n) {
      console.error("❌ Gas limit muito alto");
      return false;
    }

    // Verifica intervalo mínimo entre execuções
    const minInterval = await contract.minPerformInterval();
    if (minInterval < 60n) {
      console.error("❌ Intervalo mínimo muito baixo");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar circuit breakers:", error);
    return false;
  }
}

// Função para validar parâmetros de registro
export function validateRegistrationParams(params: any): boolean {
  try {
    // Verifica nome
    if (!params.name || params.name.length < 3) {
      console.error("❌ Nome inválido");
      return false;
    }

    // Verifica endereço do contrato
    if (!ethers.isAddress(params.upkeepContract)) {
      console.error("❌ Endereço do contrato inválido");
      return false;
    }

    // Verifica gas limit
    if (params.gasLimit < 100000 || params.gasLimit > 5000000) {
      console.error("❌ Gas limit fora do intervalo permitido");
      return false;
    }

    // Verifica admin
    if (!ethers.isAddress(params.adminAddress)) {
      console.error("❌ Endereço do admin inválido");
      return false;
    }

    // Verifica quantidade de LINK
    if (params.amount < ethers.parseEther("0.1")) {
      console.error("❌ Quantidade de LINK muito baixa");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao validar parâmetros:", error);
    return false;
  }
}

// Função para verificar rate limiting
export async function checkRateLimiting(
  contract: HedgeAutomation,
  registry: any,
  upkeepID: bigint
): Promise<boolean> {
  try {
    // Obtém informações do último perform
    const upkeepInfo = await registry.getUpkeep(upkeepID);
    const lastPerformBlock = upkeepInfo.lastPerformBlockNumber;
    const currentBlock = await ethers.provider.getBlockNumber();
    
    // Verifica se passou tempo suficiente desde o último perform
    const minBlocks = 5; // Mínimo de blocos entre performs
    if (currentBlock - lastPerformBlock < minBlocks) {
      console.error("❌ Rate limit atingido");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar rate limiting:", error);
    return false;
  }
}

// Função para verificar pausable
export async function checkPausable(registry: any, upkeepID: bigint): Promise<boolean> {
  try {
    const upkeepInfo = await registry.getUpkeep(upkeepID);
    
    if (upkeepInfo.paused) {
      console.error("❌ Upkeep está pausado");
      return false;
    }

    return true;
  } catch (error) {
    console.error("❌ Erro ao verificar pausable:", error);
    return false;
  }
} 