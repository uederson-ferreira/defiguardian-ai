import { ethers } from "hardhat";

async function main() {
  try {
    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Endereços
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const UPKEEP = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK_TOKEN = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const LINK_AMOUNT = ethers.parseEther("0.5"); // 0.5 LINK

    // ABIs
    const linkAbi = [
      "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    const registryAbi = [
      "function registerUpkeep(address target, uint32 gasLimit, address admin, bytes checkData, bytes encryptedEmail) external returns (uint256 id)"
    ];

    // Contratos
    const linkToken = new ethers.Contract(LINK_TOKEN, linkAbi, signer);
    const registry = new ethers.Contract(REGISTRY, registryAbi, signer);

    // 1. Aprovar LINK
    console.log("⏳ Aprovando LINK...");
    const approveTx = await linkToken.approve(REGISTRY, LINK_AMOUNT, {
      gasLimit: 100000
    });
    console.log("📤 Approve TX:", approveTx.hash);
    await approveTx.wait();
    console.log("✅ LINK aprovado!");

    // 2. Registrar Upkeep
    console.log("\n⏳ Registrando Upkeep...");
    const registerTx = await registry.registerUpkeep(
      UPKEEP,           // target
      500000,           // gasLimit
      signer.address,   // admin
      "0x",             // checkData
      "0x",             // encryptedEmail
      {
        gasLimit: 500000,
        value: ethers.parseEther("0.1") // Enviando 0.1 ETH como garantia
      }
    );

    console.log("📤 Register TX:", registerTx.hash);
    const receipt = await registerTx.wait();
    console.log("✅ Upkeep registrado! Bloco:", receipt.blockNumber);

  } catch (error: any) {
    console.error("❌ Erro:", error.message || error);
    process.exit(1);
  }
}

main(); 