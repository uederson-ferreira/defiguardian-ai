import { ethers } from "hardhat";

async function main() {
  try {
    console.log("Iniciando registro no Chainlink Automation...");

    const [signer] = await ethers.getSigners();
    console.log("Usando conta:", signer.address);

    // Endereço do Registry do Chainlink Automation na Sepolia
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    
    // Endereço do seu contrato HedgeAutomation
    const HEDGE_AUTOMATION_ADDRESS = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";

    // Verificando saldo LINK
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
    const linkBalance = await linkContract.balanceOf(signer.address);
    console.log("Saldo LINK:", ethers.formatEther(linkBalance));

    // Verificando allowance
    const allowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    console.log("Allowance atual:", ethers.formatEther(allowance));

    // Parâmetros de registro
    const REGISTRATION_PARAMS = {
      name: "RiskGuardian",
      encryptedEmail: "0x", // Não é necessário para testes
      upkeepContract: HEDGE_AUTOMATION_ADDRESS,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0, // Custom logic
      checkData: "0x",
      triggerConfig: "0x",
      offchainConfig: "0x",
      amount: ethers.parseEther("0.1") // 0.1 LINK
    };

    // Obtém o contrato do Registry
    console.log("Obtendo contrato do Registry...");
    const Registry = await ethers.getContractAt(
      "IAutomationRegistry",
      REGISTRY_ADDRESS
    );

    // Registra o Upkeep
    console.log("Registrando Upkeep com os seguintes parâmetros:");
    console.log(JSON.stringify(REGISTRATION_PARAMS, null, 2));
    
    const registerTx = await Registry.registerUpkeep(REGISTRATION_PARAMS, {
      gasLimit: 1000000 // Aumentando o gas limit para garantir
    });
    
    console.log("Transação enviada!");
    console.log("Hash da transação:", registerTx.hash);
    console.log("Aguardando confirmação...");
    
    const receipt = await registerTx.wait();
    console.log("Transação confirmada!");

    // Procura pelo evento de registro
    const registerEvent = receipt.logs.find((log: any) => {
      try {
        const parsed = Registry.interface.parseLog({
          topics: log.topics,
          data: log.data
        });
        return parsed && parsed.name === "UpkeepRegistered";
      } catch {
        return false;
      }
    });

    if (registerEvent) {
      const parsedEvent = Registry.interface.parseLog({
        topics: registerEvent.topics,
        data: registerEvent.data
      });
      if (parsedEvent) {
        console.log("Upkeep registrado com sucesso!");
        console.log("ID do Upkeep:", parsedEvent.args.id.toString());
      }
    } else {
      console.log("Upkeep registrado, mas não foi possível encontrar o ID nos logs");
    }

  } catch (error) {
    console.error("Erro ao registrar Upkeep:");
    console.error(error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 