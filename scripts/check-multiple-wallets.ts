import { ethers } from "hardhat";

// Adicione aqui os endereços das outras carteiras que está usando nos faucets
const WALLETS_TO_CHECK = [
    "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9", // Carteira principal
    // Adicione outras carteiras aqui se quiser monitorar:
    // "0x...", 
    // "0x...",
];

async function checkMultipleWallets() {
    console.log("🔍 Verificando múltiplas carteiras...");
    console.log("=" .repeat(60));
    
    const sepoliaProvider = new ethers.providers.JsonRpcProvider(
        `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`
    );
    
    let totalEth = 0;
    
    for (let i = 0; i < WALLETS_TO_CHECK.length; i++) {
        const address = WALLETS_TO_CHECK[i];
        const balance = await sepoliaProvider.getBalance(address);
        const balanceEth = parseFloat(ethers.utils.formatEther(balance));
        
        console.log(`📝 Carteira ${i + 1}: ${address}`);
        console.log(`💰 Saldo: ${balanceEth} ETH`);
        
        if (balanceEth > 0.001) {
            console.log("✅ Tem ETH! 🎉");
        }
        
        totalEth += balanceEth;
        console.log("-" .repeat(40));
    }
    
    console.log(`💎 TOTAL combinado: ${totalEth.toFixed(6)} ETH`);
    
    if (totalEth >= 0.1) {
        console.log("🚀 SUFICIENTE PARA DEPLOY!");
        console.log("💡 Transfira tudo para carteira principal se necessário");
    } else {
        console.log("⏳ Continue minerando faucets...");
    }
}

checkMultipleWallets()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Erro:", error);
        process.exit(1);
    }); 