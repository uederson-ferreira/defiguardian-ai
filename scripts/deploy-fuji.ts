import { ethers } from "hardhat";
import { run } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  // Verifica variáveis de ambiente
  if (!process.env.FUJI_CCIP_ROUTER || !process.env.FUJI_PRICE_FEED || !process.env.FUJI_LINK_TOKEN) {
    throw new Error("Variáveis de ambiente FUJI não configuradas");
  }

  console.log("Iniciando deploy na Avalanche Fuji...");

  try {
    // Deploy do CrossChainHedge
    console.log("\nDeployando CrossChainHedge...");
    const CrossChainHedge = await ethers.getContractFactory("CrossChainHedge");
    const hedge = await CrossChainHedge.deploy(
      process.env.FUJI_PRICE_FEED,
      process.env.FUJI_LINK_TOKEN
    );
    await hedge.deployed();
    console.log(`CrossChainHedge deployado em: ${hedge.address}`);

    // Deploy do CCIP Adapter
    console.log("\nDeployando ChainlinkCCIPAdapter...");
    const ChainlinkCCIPAdapter = await ethers.getContractFactory("ChainlinkCCIPAdapter");
    const ccipAdapter = await ChainlinkCCIPAdapter.deploy(
      process.env.FUJI_CCIP_ROUTER,
      process.env.FUJI_LINK_TOKEN
    );
    await ccipAdapter.deployed();
    console.log(`ChainlinkCCIPAdapter deployado em: ${ccipAdapter.address}`);

    // Deploy do HedgeAutomation
    console.log("\nDeployando HedgeAutomation...");
    const HedgeAutomation = await ethers.getContractFactory("HedgeAutomation");
    const automation = await HedgeAutomation.deploy(hedge.address);
    await automation.deployed();
    console.log(`HedgeAutomation deployado em: ${automation.address}`);

    // Configuração do sistema
    console.log("\nConfigurando sistema...");

    // Configura Sepolia como chain suportada
    console.log("Configurando Sepolia no CrossChainHedge...");
    const tx1 = await hedge.configureChain(
      11155111, // Sepolia Chain ID
      "0x694AA1769357215DE4FAC081bf1f309aDC325306", // Sepolia ETH/USD
      ccipAdapter.address,
      process.env.SEPOLIA_CHAIN_SELECTOR
    );
    await tx1.wait();

    // Configura Fuji
    console.log("Configurando Fuji no CrossChainHedge...");
    const tx2 = await hedge.configureChain(
      43113, // Fuji Chain ID
      process.env.FUJI_PRICE_FEED,
      ccipAdapter.address,
      process.env.FUJI_CHAIN_SELECTOR
    );
    await tx2.wait();

    // Aguarda para verificação
    console.log("\nAguardando 30 segundos para verificação...");
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Verifica contratos
    console.log("\nVerificando contratos no Snowtrace...");
    
    await Promise.all([
      verifyContract(hedge.address, [process.env.FUJI_PRICE_FEED, process.env.FUJI_LINK_TOKEN], "CrossChainHedge"),
      verifyContract(ccipAdapter.address, [process.env.FUJI_CCIP_ROUTER, process.env.FUJI_LINK_TOKEN], "ChainlinkCCIPAdapter"),
      verifyContract(automation.address, [hedge.address], "HedgeAutomation")
    ]);

    console.log("\nEndereços deployados:");
    console.log(`CrossChainHedge: ${hedge.address}`);
    console.log(`ChainlinkCCIPAdapter: ${ccipAdapter.address}`);
    console.log(`HedgeAutomation: ${automation.address}`);

  } catch (error) {
    console.error("\nErro durante o deploy:", error);
    throw error;
  }
}

async function verifyContract(address: string, constructorArgs: any[], name: string) {
  try {
    await run("verify:verify", {
      address: address,
      constructorArguments: constructorArgs,
    });
    console.log(`${name} verificado com sucesso!`);
  } catch (error: any) {
    if (error.message.includes("Already Verified")) {
      console.log(`${name} já está verificado`);
    } else {
      console.error(`Erro ao verificar ${name}:`, error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 