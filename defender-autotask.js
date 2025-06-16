const { DefenderRelaySigner, DefenderRelayProvider } = require('defender-relay-client/lib/ethers');
const { ethers } = require('ethers');

// ABI mínimo necessário
const ABI = [
    "function checkUpkeep(bytes) external returns (bool, bytes)",
    "function performUpkeep(bytes) external",
];

// Endereço do contrato
const CONTRACT_ADDRESS = "0xF19B115b906a7B085b04944A1c53017Bb6B4c92a";

async function handler(event) {
    // Inicializa provider e signer
    const provider = new DefenderRelayProvider(event);
    const signer = new DefenderRelaySigner(event, provider, { speed: 'fast' });

    // Inicializa o contrato
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

    try {
        // Verifica se precisa executar
        const [needsUpkeep] = await contract.checkUpkeep("0x");
        console.log("Needs upkeep:", needsUpkeep);

        if (needsUpkeep) {
            // Executa o upkeep
            console.log("Executing upkeep...");
            const tx = await contract.performUpkeep("0x", {
                gasLimit: 500000,
            });

            // Aguarda confirmação
            const receipt = await tx.wait();
            console.log("Upkeep executed:", receipt.transactionHash);

            return {
                success: true,
                hash: receipt.transactionHash
            };
        } else {
            console.log("No upkeep needed");
            return {
                success: true,
                message: "No upkeep needed"
            };
        }

    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
}

module.exports = {
    handler,
};