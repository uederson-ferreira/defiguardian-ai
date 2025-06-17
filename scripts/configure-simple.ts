import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configuração simplificada dos contratos...\n");
  
  // Carregar endereços dos contratos
  const fs = require('fs');
  let addresses;
  
  try {
    addresses = JSON.parse(fs.readFileSync('deployed-hedge-contracts.json', 'utf8'));
  } catch {
    console.log("❌ Arquivo não encontrado!");
    process.exit(1);
  }
  
  const [signer] = await ethers.getSigners();
  console.log("📝 Configurando com a conta:", signer.address);
  
  // Endereços Sepolia
  const SEPOLIA_ADDRESSES = {
    ETH_USD_PRICE_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    LINK_USD_PRICE_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    LINK_TOKEN: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    WETH_TOKEN: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"
  };
  
  try {
    // Apenas configurar o RiskGuardianMaster (mais simples)
    console.log("🔄 Configurando apenas RiskGuardianMaster...");
    const riskGuardianMaster = await ethers.getContractAt("RiskGuardianMaster", addresses.RiskGuardianMaster);
    
    // Configurar automação
    const tx = await riskGuardianMaster.updateAutomationConfig(
      true,  // stopLossEnabled
      true,  // rebalanceEnabled  
      true,  // volatilityEnabled
      false, // crossChainEnabled
      300,   // checkInterval (5 minutos)
      500000 // maxGasPerUpkeep
    );
    
    console.log("⏳ Aguardando confirmação da transação...");
    await tx.wait();
    console.log("✅ RiskGuardianMaster configurado!");
    
    // Testar configuração
    console.log("\n🧪 Testando configurações...");
    const config = await riskGuardianMaster.getAutomationConfig();
    console.log("✅ Configuração confirmada:");
    console.log("   - StopLoss:", config.stopLossEnabled);
    console.log("   - Rebalance:", config.rebalanceEnabled);
    console.log("   - Volatilidade:", config.volatilityEnabled);
    console.log("   - Intervalo:", config.checkInterval, "segundos");
    
    console.log("\n🎉 CONFIGURAÇÃO BÁSICA CONCLUÍDA!");
    console.log("📋 O sistema está pronto para registrar no Chainlink Automation");
    
    // Salvar configuração básica
    addresses.basicConfigured = true;
    addresses.configuredAt = new Date().toISOString();
    fs.writeFileSync('deployed-hedge-contracts.json', JSON.stringify(addresses, null, 2));
    
    console.log("\n🔗 Próximo passo:");
    console.log("📝 Registrar o RiskGuardianMaster no Chainlink Automation");
    console.log(`🎯 Endereço: ${addresses.RiskGuardianMaster}`);
    
  } catch (error) {
    console.error("❌ Erro:", error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }); 