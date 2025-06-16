import { ethers } from "hardhat";

async function main() {
  try {
    // Endereços fornecidos
    const WALLET_ADDRESS = "0xe8f35a0b15ad587e1b0967bcc2024de834667dc9";
    const REGISTRAR_ADDRESS = "0xb0e49c5d0d05cbc241d68c05bc5ba1d1b7b72976";
    const REGISTRATION_HASH = "0x00195deadc1a33554fc65bcfb7eb85311d75362461564afc44ab1002f0964f55";

    // Obtém o signer
    const [signer] = await ethers.getSigners();
    console.log("🔑 Usando conta:", signer.address);

    // Verifica se é a conta correta
    if (signer.address.toLowerCase() !== WALLET_ADDRESS.toLowerCase()) {
      throw new Error(`Conta incorreta! Use a conta ${WALLET_ADDRESS}`);
    }

    // Assina a mensagem
    console.log("📝 Assinando mensagem de registro...");
    const signature = await signer.signMessage(ethers.getBytes(REGISTRATION_HASH));

    console.log("\n✅ Assinatura gerada com sucesso!");
    console.log("\n📋 Detalhes da assinatura:");
    console.log("Endereço do registrador:", REGISTRAR_ADDRESS);
    console.log("Hash de registro:", REGISTRATION_HASH);
    console.log("Assinatura:", signature);
    
    console.log("\n🔍 Próximos passos:");
    console.log("1. Copie a assinatura acima");
    console.log("2. Cole no campo de assinatura solicitado");
    console.log("3. Continue com o processo de registro");

  } catch (error) {
    console.error("❌ Erro ao gerar assinatura:");
    console.error(error);
    process.exit(1);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 