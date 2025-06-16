import { ethers } from "hardhat";

async function main() {
  try {
    const REGISTRY = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    const [signer] = await ethers.getSigners();
    console.log("📝 Conta:", signer.address);

    // 1. Verificar saldo ETH
    const ethBalance = await signer.provider.getBalance(signer.address);
    console.log("💰 Saldo ETH:", ethers.formatEther(ethBalance));
    if (ethBalance < ethers.parseEther("0.1")) {
      throw new Error("Saldo ETH muito baixo! Precisa de pelo menos 0.1 ETH");
    }

    // 2. Verificar saldo LINK
    const linkContract = await ethers.getContractAt("IERC20", LINK);
    const linkBalance = await linkContract.balanceOf(signer.address);
    console.log("🔗 Saldo LINK:", ethers.formatEther(linkBalance));
    if (linkBalance < ethers.parseEther("5")) {
      throw new Error("Saldo LINK muito baixo! Precisa de pelo menos 5 LINK");
    }

    // 3. Verificar allowance
    const allowance = await linkContract.allowance(signer.address, REGISTRY);
    console.log("👍 Allowance atual:", ethers.formatEther(allowance));
    
    // 4. Fazer approve se necessário
    if (allowance < ethers.parseEther("5")) {
      console.log("⚡ Aprovando LINK...");
      const approveTx = await linkContract.approve(
        REGISTRY,
        ethers.parseEther("10"),
        {
          gasLimit: 100000,
          maxFeePerGas: ethers.parseUnits("20", "gwei"),
          maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei")
        }
      );
      await approveTx.wait();
      console.log("✅ LINK aprovado!");
    }

    // 5. Verificar se o contrato existe
    const code = await signer.provider.getCode(HEDGE_AUTOMATION);
    if (code === "0x") {
      throw new Error("Contrato não encontrado no endereço especificado!");
    }

    // 6. Registrar Upkeep
    const registry = await ethers.getContractAt("IAutomationRegistry", REGISTRY);
    
    console.log("🚀 Registrando Upkeep...");
    
    const tx = await registry.registerUpkeep({
      name: "RiskGuardian Automation V3",
      encryptedEmail: ethers.toUtf8Bytes(""),
      upkeepContract: HEDGE_AUTOMATION,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: ethers.toUtf8Bytes(""),
      triggerConfig: ethers.toUtf8Bytes(""),
      offchainConfig: ethers.toUtf8Bytes(JSON.stringify({ maxGasPrice: 30000000000 })),
      amount: ethers.parseEther("5")
    }, {
      gasLimit: 1000000,
      maxFeePerGas: ethers.parseUnits("20", "gwei"),
      maxPriorityFeePerGas: ethers.parseUnits("1.5", "gwei")
    });

    console.log("📤 Transação enviada:", tx.hash);
    console.log("🔗 Acompanhe em: https://sepolia.etherscan.io/tx/" + tx.hash);
    console.log("⏳ Aguardando confirmação (pode demorar alguns minutos)...");

    const receipt = await tx.wait(2);
    console.log("✅ Transação confirmada com 2 blocos!");
    
    if (receipt.status === 1) {
      const upkeepID = receipt.logs[0].topics[1];
      console.log("🎉 Upkeep registrado com sucesso!");
      console.log("📝 ID do Upkeep:", upkeepID);
      console.log("\n🔍 Próximos passos:");
      console.log("1. Verifique o registro em: https://automation.chain.link");
      console.log("2. Monitore as primeiras execuções");
      console.log("3. Ajuste o gas limit se necessário");
    } else {
      throw new Error("Transação falhou! Verifique no Etherscan.");
    }

  } catch (error) {
    console.error("❌ Erro ao registrar Upkeep:");
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