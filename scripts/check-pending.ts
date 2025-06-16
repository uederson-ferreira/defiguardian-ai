import { ethers } from "hardhat";

async function main() {
  try {
    console.log("Verificando transações pendentes...");

    const [signer] = await ethers.getSigners();
    console.log("Usando conta:", signer.address);

    // Obtendo o nonce atual
    const nonce = await signer.getNonce();
    console.log("Nonce atual:", nonce);

    // Obtendo o preço do gás atual
    const feeData = await ethers.provider.getFeeData();
    console.log("Preço do gás atual:", ethers.formatUnits(feeData.gasPrice || 0, "gwei"), "gwei");

    // Enviando uma transação vazia com o mesmo nonce e gás mais alto para cancelar
    console.log("Tentando cancelar transações pendentes...");
    const tx = await signer.sendTransaction({
      to: signer.address,
      value: 0,
      nonce: nonce - 1, // Usando o nonce da última transação
      maxFeePerGas: ethers.parseUnits("100", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("5", "gwei"),
      gasLimit: 21000
    });

    console.log("Transação de cancelamento enviada:", tx.hash);
    console.log("Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("Transação confirmada no bloco:", receipt.blockNumber);

  } catch (error) {
    console.error("Erro ao verificar/cancelar transações:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 