import { ethers, run } from "hardhat";
import { StopLossHedge, RebalanceHedge, VolatilityHedge, RiskGuardianMaster } from "../typechain-types";

interface DeployResult {
  name: string;
  address: string;
  deploymentTx: string;
  gasUsed: number;
  verified: boolean;
}

async function main() {
  console.log("🚀 Iniciando deploy dos contratos de hedge específicos...\n");
  
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying com a conta:", deployer.address);
  
  // Verifica saldos
  const balance = await deployer.getBalance();
  console.log("💰 Saldo ETH:", ethers.utils.formatEther(balance), "ETH");
  
  if (balance.lt(ethers.utils.parseEther("0.05"))) {
    console.log("❌ Saldo ETH insuficiente para deploy!");
    console.log("💡 Use o faucet: https://faucets.chain.link/sepolia");
    process.exit(1);
  }
  
  const deployResults: DeployResult[] = [];
  let totalGasUsed = 0;
  
  try {
    // 1. Deploy StopLossHedge
    console.log("📄 Deploying StopLossHedge...");
    const StopLossHedgeFactory = await ethers.getContractFactory("StopLossHedge");
    const stopLossHedge = await StopLossHedgeFactory.deploy();
    await stopLossHedge.deployed();
    
    const stopLossReceipt = await stopLossHedge.deployTransaction.wait();
    console.log("✅ StopLossHedge deployed:", stopLossHedge.address);
    console.log("⛽ Gas usado:", stopLossReceipt.gasUsed.toString());
    
    deployResults.push({
      name: "StopLossHedge",
      address: stopLossHedge.address,
      deploymentTx: stopLossHedge.deployTransaction.hash,
      gasUsed: stopLossReceipt.gasUsed.toNumber(),
      verified: false
    });
    totalGasUsed += stopLossReceipt.gasUsed.toNumber();
    
    // 2. Deploy RebalanceHedge
    console.log("\n📄 Deploying RebalanceHedge...");
    const RebalanceHedgeFactory = await ethers.getContractFactory("RebalanceHedge");
    const rebalanceHedge = await RebalanceHedgeFactory.deploy();
    await rebalanceHedge.deployed();
    
    const rebalanceReceipt = await rebalanceHedge.deployTransaction.wait();
    console.log("✅ RebalanceHedge deployed:", rebalanceHedge.address);
    console.log("⛽ Gas usado:", rebalanceReceipt.gasUsed.toString());
    
    deployResults.push({
      name: "RebalanceHedge",
      address: rebalanceHedge.address,
      deploymentTx: rebalanceHedge.deployTransaction.hash,
      gasUsed: rebalanceReceipt.gasUsed.toNumber(),
      verified: false
    });
    totalGasUsed += rebalanceReceipt.gasUsed.toNumber();
    
    // 3. Deploy VolatilityHedge
    console.log("\n📄 Deploying VolatilityHedge...");
    const VolatilityHedgeFactory = await ethers.getContractFactory("VolatilityHedge");
    const volatilityHedge = await VolatilityHedgeFactory.deploy();
    await volatilityHedge.deployed();
    
    const volatilityReceipt = await volatilityHedge.deployTransaction.wait();
    console.log("✅ VolatilityHedge deployed:", volatilityHedge.address);
    console.log("⛽ Gas usado:", volatilityReceipt.gasUsed.toString());
    
    deployResults.push({
      name: "VolatilityHedge",
      address: volatilityHedge.address,
      deploymentTx: volatilityHedge.deployTransaction.hash,
      gasUsed: volatilityReceipt.gasUsed.toNumber(),
      verified: false
    });
    totalGasUsed += volatilityReceipt.gasUsed.toNumber();
    
    // 4. Deploy RiskGuardianMaster
    console.log("\n📄 Deploying RiskGuardianMaster...");
    const RiskGuardianMasterFactory = await ethers.getContractFactory("RiskGuardianMaster");
    const riskGuardianMaster = await RiskGuardianMasterFactory.deploy();
    await riskGuardianMaster.deployed();
    
    const masterReceipt = await riskGuardianMaster.deployTransaction.wait();
    console.log("✅ RiskGuardianMaster deployed:", riskGuardianMaster.address);
    console.log("⛽ Gas usado:", masterReceipt.gasUsed.toString());
    
    deployResults.push({
      name: "RiskGuardianMaster",
      address: riskGuardianMaster.address,
      deploymentTx: riskGuardianMaster.deployTransaction.hash,
      gasUsed: masterReceipt.gasUsed.toNumber(),
      verified: false
    });
    totalGasUsed += masterReceipt.gasUsed.toNumber();
    
    // 5. Configurar RiskGuardianMaster com os endereços dos outros contratos
    console.log("\n🔧 Configurando RiskGuardianMaster...");
    const configureTx = await riskGuardianMaster.setHedgeContracts(
      stopLossHedge.address,
      rebalanceHedge.address,
      volatilityHedge.address,
      ethers.constants.AddressZero // CrossChainHedge será configurado separadamente
    );
    await configureTx.wait();
    console.log("✅ RiskGuardianMaster configurado!");
    
    // 6. Verificação no Etherscan
    if (process.env.ETHERSCAN_API_KEY) {
      console.log("\n🔍 Verificando contratos no Etherscan...");
      
      for (const result of deployResults) {
        try {
          console.log(`📋 Verificando ${result.name}...`);
          await run("verify:verify", {
            address: result.address,
            constructorArguments: []
          });
          result.verified = true;
          console.log(`✅ ${result.name} verificado!`);
        } catch (error) {
          console.log(`⚠️ Erro ao verificar ${result.name}:`, (error as Error).message);
        }
        
        // Aguarda entre verificações para evitar rate limit
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    
    // 7. Resumo final
    console.log("\n" + "=".repeat(60));
    console.log("🎉 DEPLOY CONCLUÍDO COM SUCESSO!");
    console.log("=".repeat(60));
    
    console.log("\n📊 Resumo dos deploys:");
    deployResults.forEach((result, index) => {
      console.log(`${index + 1}. ${result.name}:`);
      console.log(`   📍 Address: ${result.address}`);
      console.log(`   🔗 TX: https://sepolia.etherscan.io/tx/${result.deploymentTx}`);
      console.log(`   ⛽ Gas: ${result.gasUsed.toLocaleString()}`);
      console.log(`   ✅ Verified: ${result.verified ? 'Sim' : 'Não'}`);
      console.log("");
    });
    
    console.log("📈 Total de gas usado:", totalGasUsed.toLocaleString());
    
    const finalBalance = await deployer.getBalance();
    const gasSpent = balance.sub(finalBalance);
    console.log("💰 ETH gasto total:", ethers.utils.formatEther(gasSpent), "ETH");
    console.log("💰 Saldo final:", ethers.utils.formatEther(finalBalance), "ETH");
    
    // 8. Configurações recomendadas
    console.log("\n🎯 Próximos passos:");
    console.log("1. Configure price feeds nos contratos de hedge");
    console.log("2. Registre o RiskGuardianMaster no Chainlink Automation");
    console.log("3. Configure tokens suportados em cada contrato");
    console.log("4. Teste as funcionalidades em ambiente de testnet");
    
    // Salva endereços em arquivo
    const addresses = {
      StopLossHedge: stopLossHedge.address,
      RebalanceHedge: rebalanceHedge.address,
      VolatilityHedge: volatilityHedge.address,
      RiskGuardianMaster: riskGuardianMaster.address,
      deployer: deployer.address,
      network: "sepolia",
      deployedAt: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync('deployed-hedge-contracts.json', JSON.stringify(addresses, null, 2));
    console.log("\n📄 Endereços salvos em: deployed-hedge-contracts.json");
    
  } catch (error) {
    console.error("❌ Erro durante o deploy:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n🎉 Deploy finalizado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }); 