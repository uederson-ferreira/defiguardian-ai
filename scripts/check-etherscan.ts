import axios from 'axios';

const ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";
const ETHERSCAN_API_KEY = "YFIKSIHHD5GHGBT19Y8BGSAGK3CFY72KC3";

async function checkEtherscan() {
    console.log("🔍 Verificando via Etherscan API...");
    console.log(`📍 Endereço: ${ADDRESS}`);
    console.log("=" .repeat(60));
    
    try {
        // Mainnet
        const mainnetUrl = `https://api.etherscan.io/api?module=account&action=balance&address=${ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
        const mainnetResponse = await axios.get(mainnetUrl);
        const mainnetBalanceWei = mainnetResponse.data.result;
        const mainnetBalanceEth = parseFloat(mainnetBalanceWei) / 1e18;
        
        // Sepolia  
        const sepoliaUrl = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
        const sepoliaResponse = await axios.get(sepoliaUrl);
        const sepoliaBalanceWei = sepoliaResponse.data.result;
        const sepoliaBalanceEth = parseFloat(sepoliaBalanceWei) / 1e18;
        
        console.log(`🌐 Mainnet ETH: ${mainnetBalanceEth.toFixed(6)} ETH`);
        console.log(`🧪 Sepolia ETH: ${sepoliaBalanceEth.toFixed(6)} ETH`);
        
        // Verificar transações recentes
        const txUrl = `https://api-sepolia.etherscan.io/api?module=account&action=txlist&address=${ADDRESS}&startblock=0&endblock=99999999&page=1&offset=5&sort=desc&apikey=${ETHERSCAN_API_KEY}`;
        const txResponse = await axios.get(txUrl);
        
        if (txResponse.data.result && txResponse.data.result.length > 0) {
            console.log("\n📋 Últimas 3 transações Sepolia:");
            console.log("-" .repeat(40));
            
            for (let i = 0; i < Math.min(3, txResponse.data.result.length); i++) {
                const tx = txResponse.data.result[i];
                const value = parseFloat(tx.value) / 1e18;
                const timestamp = new Date(parseInt(tx.timeStamp) * 1000);
                
                console.log(`💰 ${value.toFixed(6)} ETH`);
                console.log(`🕒 ${timestamp.toLocaleString()}`);
                console.log(`🔗 https://sepolia.etherscan.io/tx/${tx.hash}`);
                console.log("-" .repeat(20));
            }
        }
        
        // Status para deploy
        if (sepoliaBalanceEth >= 0.001) {
            console.log("\n🚀 PRONTO PARA DEPLOY!");
        } else {
            console.log("\n⏳ Aguardando mais ETH...");
        }
        
    } catch (error) {
        console.error("❌ Erro ao consultar Etherscan:", error instanceof Error ? error.message : error);
    }
}

checkEtherscan(); 