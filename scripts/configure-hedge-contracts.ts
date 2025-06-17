import { ethers } from "hardhat";

async function main() {
  console.log("🔧 Configurando contratos de hedge...\n");
  
  // Carregar endereços dos contratos deployados
  const fs = require('fs');
  let addresses;
  
  try {
    addresses = JSON.parse(fs.readFileSync('deployed-hedge-contracts.json', 'utf8'));
  } catch {
    console.log("❌ Arquivo deployed-hedge-contracts.json não encontrado!");
    console.log("💡 Execute primeiro: npx hardhat run scripts/deploy-hedge-contracts.ts --network sepolia");
    process.exit(1);
  }
  
  const [signer] = await ethers.getSigners();
  console.log("📝 Configurando com a conta:", signer.address);
  
  // Endereços conhecidos na Sepolia
  const SEPOLIA_ADDRESSES = {
    ETH_USD_PRICE_FEED: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    BTC_USD_PRICE_FEED: "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    LINK_USD_PRICE_FEED: "0xc59E3633BAAC79493d908e63626716e204A45EdF",
    LINK_TOKEN: "0x779877A7B0D9E8603169DdbD7836e478b4624789",
    WETH_TOKEN: "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14", // WETH na Sepolia
    USDC_MOCK: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" // Endereço exemplo
  };
  
  try {
    // 1. Configurar StopLossHedge
    console.log("🔄 Configurando StopLossHedge...");
    const stopLossHedge = await ethers.getContractAt("StopLossHedge", addresses.StopLossHedge);
    
    // Configurar tokens suportados (usando WETH ao invés de address zero)
    await stopLossHedge.configureToken(
      SEPOLIA_ADDRESSES.WETH_TOKEN, // WETH na Sepolia
      SEPOLIA_ADDRESSES.ETH_USD_PRICE_FEED,
      ethers.utils.parseEther("0.01") // Mínimo 0.01 WETH
    );
    console.log("✅ WETH configurado no StopLossHedge");
    
    await stopLossHedge.configureToken(
      SEPOLIA_ADDRESSES.LINK_TOKEN,
      SEPOLIA_ADDRESSES.LINK_USD_PRICE_FEED,
      ethers.utils.parseEther("1") // Mínimo 1 LINK
    );
    console.log("✅ LINK configurado no StopLossHedge");
    
    // 2. Configurar RebalanceHedge
    console.log("\n🔄 Configurando RebalanceHedge...");
    const rebalanceHedge = await ethers.getContractAt("RebalanceHedge", addresses.RebalanceHedge);
    
    // Adicionar tokens suportados
    await rebalanceHedge.addSupportedToken(
      SEPOLIA_ADDRESSES.WETH_TOKEN, // WETH
      SEPOLIA_ADDRESSES.ETH_USD_PRICE_FEED,
      18 // decimals
    );
    console.log("✅ WETH configurado no RebalanceHedge");
    
    await rebalanceHedge.addSupportedToken(
      SEPOLIA_ADDRESSES.LINK_TOKEN,
      SEPOLIA_ADDRESSES.LINK_USD_PRICE_FEED,
      18 // decimals
    );
    console.log("✅ LINK configurado no RebalanceHedge");
    
    // 3. Configurar VolatilityHedge
    console.log("\n🔄 Configurando VolatilityHedge...");
    const volatilityHedge = await ethers.getContractAt("VolatilityHedge", addresses.VolatilityHedge);
    
    // Configurar tokens para proteção de volatilidade
    await volatilityHedge.configureToken(
      SEPOLIA_ADDRESSES.WETH_TOKEN, // WETH
      SEPOLIA_ADDRESSES.ETH_USD_PRICE_FEED,
      SEPOLIA_ADDRESSES.LINK_TOKEN, // Token estável (usando LINK como exemplo)
      18, // decimals
      50 // máximo 50 pontos no histórico
    );
    console.log("✅ WETH configurado no VolatilityHedge");
    
    await volatilityHedge.configureToken(
      SEPOLIA_ADDRESSES.LINK_TOKEN,
      SEPOLIA_ADDRESSES.LINK_USD_PRICE_FEED,
      SEPOLIA_ADDRESSES.LINK_TOKEN, // Auto-referência
      18, // decimals
      50 // máximo 50 pontos no histórico
    );
    console.log("✅ LINK configurado no VolatilityHedge");
    
    // 4. Configurar RiskGuardianMaster para automação
    console.log("\n🔄 Configurando RiskGuardianMaster...");
    const riskGuardianMaster = await ethers.getContractAt("RiskGuardianMaster", addresses.RiskGuardianMaster);
    
    // Configurar automação (5 minutos de intervalo, todos os tipos habilitados)
    await riskGuardianMaster.updateAutomationConfig(
      true,  // stopLossEnabled
      true,  // rebalanceEnabled
      true,  // volatilityEnabled
      false, // crossChainEnabled (até configurar o CrossChainHedge)
      300,   // checkInterval (5 minutos)
      500000 // maxGasPerUpkeep
    );
    console.log("✅ Configurações de automação atualizadas");
    
    // 5. Testar configurações
    console.log("\n🧪 Testando configurações...");
    
    // Testa StopLossHedge
    try {
      const wethPrice = await stopLossHedge.getCurrentPrice(SEPOLIA_ADDRESSES.WETH_TOKEN);
      console.log("✅ StopLossHedge - Preço WETH:", ethers.utils.formatUnits(wethPrice, 8), "USD");
    } catch (error) {
      console.log("⚠️ Erro ao testar StopLossHedge:", (error as Error).message);
    }
    
    // Testa RebalanceHedge
    try {
      const linkPrice = await rebalanceHedge.getTokenPrice(SEPOLIA_ADDRESSES.LINK_TOKEN);
      console.log("✅ RebalanceHedge - Preço LINK:", ethers.utils.formatUnits(linkPrice, 8), "USD");
    } catch (error) {
      console.log("⚠️ Erro ao testar RebalanceHedge:", (error as Error).message);
    }
    
    // Testa VolatilityHedge
    try {
      const wethPriceVol = await volatilityHedge.getCurrentPrice(SEPOLIA_ADDRESSES.WETH_TOKEN);
      console.log("✅ VolatilityHedge - Preço WETH:", ethers.utils.formatUnits(wethPriceVol, 8), "USD");
    } catch (error) {
      console.log("⚠️ Erro ao testar VolatilityHedge:", (error as Error).message);
    }
    
    // Testa RiskGuardianMaster
    try {
      const config = await riskGuardianMaster.getAutomationConfig();
      console.log("✅ RiskGuardianMaster - Configuração OK");
      console.log("   - StopLoss habilitado:", config.stopLossEnabled);
      console.log("   - Rebalance habilitado:", config.rebalanceEnabled);
      console.log("   - Volatilidade habilitado:", config.volatilityEnabled);
      console.log("   - Intervalo de verificação:", config.checkInterval, "segundos");
    } catch (error) {
      console.log("⚠️ Erro ao testar RiskGuardianMaster:", (error as Error).message);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!");
    console.log("=".repeat(60));
    
    console.log("\n📋 Resumo das configurações:");
    console.log("🛡️ StopLossHedge: ETH e LINK configurados");
    console.log("⚖️ RebalanceHedge: ETH e LINK configurados");
    console.log("📈 VolatilityHedge: ETH e LINK configurados");
    console.log("🎛️ RiskGuardianMaster: Automação configurada");
    
    console.log("\n🔗 Links úteis:");
    console.log(`🔍 StopLossHedge: https://sepolia.etherscan.io/address/${addresses.StopLossHedge}`);
    console.log(`🔍 RebalanceHedge: https://sepolia.etherscan.io/address/${addresses.RebalanceHedge}`);
    console.log(`🔍 VolatilityHedge: https://sepolia.etherscan.io/address/${addresses.VolatilityHedge}`);
    console.log(`🔍 RiskGuardianMaster: https://sepolia.etherscan.io/address/${addresses.RiskGuardianMaster}`);
    
    console.log("\n🎯 Próximos passos:");
    console.log("1. 📝 Registrar RiskGuardianMaster no Chainlink Automation");
    console.log("2. 🧪 Criar posições de teste para validar funcionamento");
    console.log("3. 📊 Implementar monitoramento e alertas");
    console.log("4. 🌐 Configurar CrossChainHedge para operações multi-rede");
    
    // Atualiza arquivo com informações de configuração
    addresses.configured = true;
    addresses.configuredAt = new Date().toISOString();
    addresses.priceFeeds = SEPOLIA_ADDRESSES;
    
    fs.writeFileSync('deployed-hedge-contracts.json', JSON.stringify(addresses, null, 2));
    console.log("\n📄 Configurações salvas em: deployed-hedge-contracts.json");
    
  } catch (error) {
    console.error("❌ Erro durante a configuração:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Configuração finalizada com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }); 