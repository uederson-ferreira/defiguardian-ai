import axios from 'axios';

const ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";
const ETHERSCAN_API_KEY = "YFIKSIHHD5GHGBT19Y8BGSAGK3CFY72KC3";

// Hashes das transações suspeitas
const SUSPICIOUS_TXS = [
    "0x1649b298a5b4ad7f4d8d708d6289cc6975da5e7d4b3d5f8bbe892853873ae0c4", // 0.05 ETH
    "0x7ca18ed08ab0666704a0cf7859947b802f31ec8421880e6f0f932da9b62ff5ac"  // 5.92 ETH
];

async function checkTransactionDetails() {
    console.log("🔍 Investigando transações suspeitas...");
    console.log("=" .repeat(60));
    
    for (const txHash of SUSPICIOUS_TXS) {
        try {
            console.log(`\n🔗 Analisando: ${txHash.substring(0, 20)}...`);
            
            const url = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
            const response = await axios.get(url);
            
            if (response.data.result) {
                const tx = response.data.result;
                
                console.log(`📤 De: ${tx.from}`);
                console.log(`📥 Para: ${tx.to}`);
                console.log(`💰 Valor: ${parseInt(tx.value, 16) / 1e18} ETH`);
                console.log(`⛽ Gas: ${parseInt(tx.gas, 16)}`);
                console.log(`💸 Gas Price: ${parseInt(tx.gasPrice, 16) / 1e9} gwei`);
                
                // Verificar se a transação foi confirmada
                const receiptUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${txHash}&apikey=${ETHERSCAN_API_KEY}`;
                const receiptResponse = await axios.get(receiptUrl);
                
                if (receiptResponse.data.result) {
                    const receipt = receiptResponse.data.result;
                    console.log(`✅ Status: ${receipt.status === '0x1' ? 'SUCESSO' : 'FALHOU'}`);
                    console.log(`📦 Bloco: ${parseInt(receipt.blockNumber, 16)}`);
                    console.log(`⛽ Gas Usado: ${parseInt(receipt.gasUsed, 16)}`);
                } else {
                    console.log("❌ Transação não encontrada ou pendente");
                }
                
            } else {
                console.log("❌ Transação não encontrada");
            }
            
            console.log("-" .repeat(40));
            
        } catch (error) {
            console.error(`❌ Erro ao verificar transação:`, error instanceof Error ? error.message : error);
        }
    }
    
    // Verificar saldo atual via API
    try {
        const balanceUrl = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
        const balanceResponse = await axios.get(balanceUrl);
        const currentBalance = parseInt(balanceResponse.data.result) / 1e18;
        
        console.log(`\n💰 Saldo Atual Confirmado: ${currentBalance} ETH`);
        
    } catch (error) {
        console.error("❌ Erro ao verificar saldo:", error instanceof Error ? error.message : error);
    }
}

checkTransactionDetails(); 