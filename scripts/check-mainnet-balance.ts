import { ethers } from "hardhat";

async function checkMainnetBalance() {
    console.log("🔍 Verificando saldo ETH na MAINNET...");
    console.log("==================================================");
    
    const [deployer] = await ethers.getSigners();
    const address = await deployer.getAddress();
    
    console.log(`📍 Endereço: ${address}`);
    
    const balance = await deployer.getBalance();
    const balanceInEth = ethers.utils.formatEther(balance);
    
    console.log(`💰 Saldo ETH Mainnet: ${balanceInEth} ETH`);
    
    const balanceNum = parseFloat(balanceInEth);
    
    if (balanceNum > 0.001) {
        console.log("✅ Saldo suficiente para usar faucets!");
        console.log("\n🚰 Faucets recomendados:");
        console.log("1. Chainlink Faucet: https://faucets.chain.link/sepolia");
        console.log("2. Alchemy Faucet: https://sepoliafaucet.com/");
        console.log("3. QuickNode Faucet: https://faucet.quicknode.com/ethereum/sepolia");
    } else {
        console.log("⚠️ Saldo baixo - aguarde a transação da Binance chegar");
    }
}

checkMainnetBalance()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erro:", error);
        process.exit(1);
    }); 