import { ethers } from "hardhat";

async function main() {
  try {
    // Endereços na Sepolia
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // Verificando saldo LINK
    const linkContract = await ethers.getContractAt("IERC20", LINK);
    const linkBalance = await linkContract.balanceOf(signer.address);
    console.log("💰 Saldo LINK:", ethers.formatEther(linkBalance));

    // ABI mínimo necessário para registro
    const registryABI = [
      "function registerUpkeep(address target, uint32 gasLimit, address admin, bytes checkData, bytes encryptedEmail) external payable returns (uint256 id)",
      "event UpkeepRegistered(uint256 indexed id, uint32 executeGas, address admin)"
    ];

    // Conectando ao contrato
    const registry = new ethers.Contract(REGISTRY, registryABI, signer);
    
    console.log("⚡ Registrando Upkeep com LINK...");
    
    // Primeiro fazemos o approve
    console.log("👍 Aprovando LINK para o Registry...");
    const approveTx = await linkContract.approve(REGISTRY, ethers.parseEther("10"));
    await approveTx.wait();
    console.log("✅ LINK aprovado!");

    // Agora registramos o Upkeep
    const tx = await registry.registerUpkeep(
      HEDGE_AUTOMATION,
      500000,
      signer.address,
      "0x",
      "0x",
      {
        gasLimit: 1000000,
        maxFeePerGas: ethers.parseUnits("50", "gwei"),
        maxPriorityFeePerGas: ethers.parseUnits("2", "gwei"),
        value: ethers.parseEther("0.1") // Enviando ETH junto para cobrir o registro
      }
    );

    console.log("🚀 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    console.log("✅ Transação confirmada no bloco:", receipt.blockNumber);

    // Procurando evento de registro
    const registrationEvent = receipt.logs.find(
      (log: any) => log.topics[0] === ethers.id("UpkeepRegistered(uint256,uint32,address)")
    );

    if (registrationEvent) {
      const upkeepID = registrationEvent.topics[1];
      console.log("🎉 Upkeep registrado com ID:", upkeepID);
    }

  } catch (error) {
    console.error("❌ Erro ao registrar Upkeep:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 