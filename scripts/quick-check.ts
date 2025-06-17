import { ethers } from "hardhat";

async function quickCheck() {
    const [deployer] = await ethers.getSigners();
    const address = await deployer.getAddress();
    
    console.log(`🔍 Verificação Rápida: ${address}`);
    console.log("=" .repeat(50));
    
    // Conectar à Sepolia
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
    const sepoliaBalance = await sepoliaProvider.getBalance(address);
    
    // Conectar à Mainnet
    const mainnetProvider = new ethers.providers.JsonRpcProvider(
        `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
    const mainnetBalance = await mainnetProvider.getBalance(address);
    
    console.log(`📊 Mainnet ETH: ${ethers.utils.formatEther(mainnetBalance)} ETH`);
    console.log(`📊 Sepolia ETH: ${ethers.utils.formatEther(sepoliaBalance)} ETH`);
    
    const sepoliaEth = parseFloat(ethers.utils.formatEther(sepoliaBalance));
    const mainnetEth = parseFloat(ethers.utils.formatEther(mainnetBalance));
    
    if (sepoliaEth >= 0.1) {
        console.log("🚀 PRONTO PARA DEPLOY! ETH suficiente na Sepolia!");
        return true;
    } else if (mainnetEth > 0.001) {
        console.log("🚰 Use faucets agora! ETH chegou na mainnet!");
        console.log("   → Chainlink: https://faucets.chain.link/sepolia");
    } else {
        console.log("⏳ Ainda aguardando ETH...");
    }
    
    return false;
}

quickCheck()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erro:", error);
        process.exit(1);
    }); 