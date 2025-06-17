import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();
  const address = signer.address;
  
  console.log("🔍 Verificando saldos para:", address);
  console.log("=".repeat(50));
  
  // Verifica saldo ETH
  const ethBalance = await signer.getBalance();
  const ethFormatted = ethers.utils.formatEther(ethBalance);
  
  console.log("💰 Saldo ETH:", ethFormatted, "ETH");
  
  // Verifica saldo LINK
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
  const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
  const linkBalance = await linkContract.balanceOf(address);
  const linkFormatted = ethers.utils.formatEther(linkBalance);
  
  console.log("🔗 Saldo LINK:", linkFormatted, "LINK");
  
  // Verificações para deploy
  console.log("\n📊 Status para Deploy:");
  console.log("=".repeat(30));
  
  const minEthForDeploy = ethers.utils.parseEther("0.1");
  const minLinkForAutomation = ethers.utils.parseEther("5");
  
  if (ethBalance.gte(minEthForDeploy)) {
    console.log("✅ ETH suficiente para deploy");
  } else {
    console.log("❌ ETH insuficiente para deploy (precisa de pelo menos 0.1 ETH)");
    const needed = minEthForDeploy.sub(ethBalance);
    console.log("   Faltam:", ethers.utils.formatEther(needed), "ETH");
  }
  
  if (linkBalance.gte(minLinkForAutomation)) {
    console.log("✅ LINK suficiente para automação");
  } else {
    console.log("❌ LINK insuficiente para automação (precisa de pelo menos 5 LINK)");
    const needed = minLinkForAutomation.sub(linkBalance);
    console.log("   Faltam:", ethers.utils.formatEther(needed), "LINK");
  }
  
  // Estimativa de custos de deploy
  console.log("\n💸 Estimativa de Custos de Deploy:");
  console.log("=".repeat(35));
  
  const gasPrice = await signer.getGasPrice();
  const gasPriceGwei = ethers.utils.formatUnits(gasPrice, "gwei");
  
  console.log("⛽ Gas Price atual:", gasPriceGwei, "gwei");
  
  // Estimativas de gas para cada contrato
  const estimatedGas = {
    StopLossHedge: 2500000,
    RebalanceHedge: 3000000,
    VolatilityHedge: 3500000,
    RiskGuardianMaster: 2000000
  };
  
  let totalGas = 0;
  let totalCostWei = ethers.BigNumber.from(0);
  
  for (const [contract, gas] of Object.entries(estimatedGas)) {
    const costWei = gasPrice.mul(gas);
    const costEth = ethers.utils.formatEther(costWei);
    console.log(`📄 ${contract}:`, gas.toLocaleString(), "gas ~", costEth, "ETH");
    totalGas += gas;
    totalCostWei = totalCostWei.add(costWei);
  }
  
  console.log("=" * 35);
  console.log("🔄 Total estimado:", totalGas.toLocaleString(), "gas");
  console.log("💰 Custo total estimado:", ethers.utils.formatEther(totalCostWei), "ETH");
  
  // Verifica se tem saldo suficiente para todos os deploys
  if (ethBalance.gte(totalCostWei.mul(2))) { // 2x margem de segurança
    console.log("✅ Saldo ETH suficiente para todos os deploys!");
  } else {
    console.log("⚠️  Saldo ETH próximo do limite. Considere fazer um deploy por vez.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 