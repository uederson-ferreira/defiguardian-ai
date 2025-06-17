import axios from 'axios';

const TX_HASH = "0x3920b7f50277b820e09d5cd8f556a8394f377c956bafb22726f058f396104f6e";
const ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";
const ETHERSCAN_API_KEY = "YFIKSIHHD5GHGBT19Y8BGSAGK3CFY72KC3";

async function checkSpecificTransaction() {
    console.log("🔍 Verificando transação específica...");
    console.log(`🔗 TX: ${TX_HASH}`);
    console.log("=" .repeat(60));
    
    try {
        // Verificar detalhes da transação
        const url = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionByHash&txhash=${TX_HASH}&apikey=${ETHERSCAN_API_KEY}`;
        const response = await axios.get(url);
        
        if (response.data.result) {
            const tx = response.data.result;
            
            console.log(`📤 De: ${tx.from}`);
            console.log(`📥 Para: ${tx.to}`);
            console.log(`💰 Valor: ${parseInt(tx.value, 16) / 1e18} ETH`);
            console.log(`⛽ Gas Limit: ${parseInt(tx.gas, 16)}`);
            console.log(`💸 Gas Price: ${parseInt(tx.gasPrice, 16) / 1e9} gwei`);
            
            // Verificar receipt
            const receiptUrl = `https://api-sepolia.etherscan.io/api?module=proxy&action=eth_getTransactionReceipt&txhash=${TX_HASH}&apikey=${ETHERSCAN_API_KEY}`;
            const receiptResponse = await axios.get(receiptUrl);
            
            if (receiptResponse.data.result) {
                const receipt = receiptResponse.data.result;
                const success = receipt.status === '0x1';
                
                console.log(`✅ Status: ${success ? '✅ SUCESSO' : '❌ FALHOU'}`);
                console.log(`📦 Bloco: ${parseInt(receipt.blockNumber, 16)}`);
                console.log(`⛽ Gas Usado: ${parseInt(receipt.gasUsed, 16)}`);
                
                if (success && tx.to?.toLowerCase() === ADDRESS.toLowerCase()) {
                    console.log("\n🎉 TRANSAÇÃO CONFIRMADA!");
                    console.log(`💰 Você recebeu: ${parseInt(tx.value, 16) / 1e18} ETH`);
                    
                    // Verificar saldo atual
                    const balanceUrl = `https://api-sepolia.etherscan.io/api?module=account&action=balance&address=${ADDRESS}&tag=latest&apikey=${ETHERSCAN_API_KEY}`;
                    const balanceResponse = await axios.get(balanceUrl);
                    const currentBalance = parseInt(balanceResponse.data.result) / 1e18;
                    
                    console.log(`💎 Saldo Atual: ${currentBalance} ETH`);
                    
                    if (currentBalance >= 0.001) {
                        console.log("\n🚀 PRONTO PARA DEPLOY DOS CONTRATOS!");
                    }
                } else if (!success) {
                    console.log("\n❌ Transação falhou - ETH não foi transferido");
                } else {
                    console.log("\n⚠️ Transação não é para seu endereço");
                }
                
            } else {
                console.log("⏳ Transação ainda pendente...");
            }
            
        } else {
            console.log("❌ Transação não encontrada");
        }
        
    } catch (error) {
        console.error("❌ Erro:", error instanceof Error ? error.message : error);
    }
}

checkSpecificTransaction(); 