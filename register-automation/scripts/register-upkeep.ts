import { ethers } from "hardhat";

// Interface do Registry v2.1
const REGISTRY_ABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "string",
            "name": "name",
            "type": "string"
          },
          {
            "internalType": "bytes",
            "name": "encryptedEmail",
            "type": "bytes"
          },
          {
            "internalType": "address",
            "name": "upkeepContract",
            "type": "address"
          },
          {
            "internalType": "uint32",
            "name": "gasLimit",
            "type": "uint32"
          },
          {
            "internalType": "address",
            "name": "adminAddress",
            "type": "address"
          },
          {
            "internalType": "uint8",
            "name": "triggerType",
            "type": "uint8"
          },
          {
            "internalType": "bytes",
            "name": "checkData",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "triggerConfig",
            "type": "bytes"
          },
          {
            "internalType": "bytes",
            "name": "offchainConfig",
            "type": "bytes"
          },
          {
            "internalType": "uint96",
            "name": "amount",
            "type": "uint96"
          }
        ],
        "internalType": "struct RegistrationParams",
        "name": "params",
        "type": "tuple"
      }
    ],
    "name": "registerUpkeep",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "id",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

async function main() {
  try {
    console.log("🚀 Iniciando registro do Upkeep...");

    const [signer] = await ethers.getSigners();
    console.log("📝 Usando conta:", signer.address);

    // Endereços
    const REGISTRY_ADDRESS = "0x86EFBD0b6736Bed994962f9797049422A3A8E8Ad";
    const HEDGE_AUTOMATION_ADDRESS = "0xd54233246a07bfbe21cb7561a52ef8a9cfc14a6b";
    const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    // Quantidade de LINK
    const LINK_AMOUNT = ethers.parseEther("0.1");

    // Verificar saldo LINK
    const linkContract = await ethers.getContractAt("IERC20", LINK_ADDRESS);
    const balance = await linkContract.balanceOf(signer.address);
    console.log("💰 Saldo LINK:", ethers.formatEther(balance));

    if (balance < LINK_AMOUNT) {
      throw new Error("Saldo LINK insuficiente");
    }

    // Verificar allowance
    const allowance = await linkContract.allowance(signer.address, REGISTRY_ADDRESS);
    console.log("🔓 Allowance:", ethers.formatEther(allowance));

    if (allowance < LINK_AMOUNT) {
      throw new Error("Allowance insuficiente");
    }

    // Obter nonce atual
    const nonce = await signer.getNonce();
    console.log("🔢 Nonce atual:", nonce);

    // Configurar gas (valores mais altos para Sepolia)
    const maxFeePerGas = ethers.parseUnits("50", "gwei");
    const maxPriorityFeePerGas = ethers.parseUnits("2", "gwei");

    console.log("⛽ Gas configurado:");
    console.log("Max Fee:", ethers.formatUnits(maxFeePerGas, "gwei"), "gwei");
    console.log("Priority Fee:", ethers.formatUnits(maxPriorityFeePerGas, "gwei"), "gwei");

    // Parâmetros do registro
    const registrationParams = {
      name: "RiskGuardian Hedge Automation",
      encryptedEmail: "0x",
      upkeepContract: HEDGE_AUTOMATION_ADDRESS,
      gasLimit: 500000,
      adminAddress: signer.address,
      triggerType: 0,
      checkData: "0x",
      triggerConfig: "0x",
      offchainConfig: "0x",
      amount: LINK_AMOUNT
    };

    // Registrar Upkeep
    console.log("\n📝 Registrando Upkeep...");
    const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, signer);
    
    console.log("Parâmetros:", registrationParams);
    
    const tx = await registry.registerUpkeep(registrationParams, {
      gasLimit: 2000000,
      maxFeePerGas,
      maxPriorityFeePerGas,
      nonce
    });

    console.log("📤 Transação enviada:", tx.hash);
    console.log("⏳ Aguardando confirmação...");

    const receipt = await tx.wait();
    
    if (receipt.status === 0) {
      throw new Error("Transação falhou");
    }
    
    // Procurar pelo evento de registro
    const upkeepID = receipt.logs[0].topics[1];
    
    console.log("\n✅ Upkeep registrado com sucesso!");
    console.log("📋 ID do Upkeep:", upkeepID);
    console.log("🔗 Link Etherscan:", `https://sepolia.etherscan.io/tx/${tx.hash}`);

    // Verificar registro
    const getUpkeepABI = ["function getUpkeep(uint256 id) external view returns (address target, uint32 executeGas, bytes memory checkData, uint96 balance, address admin, uint64 maxValidBlocknumber, uint32 lastPerformBlockNumber, uint96 amountSpent, bool paused, bytes memory offchainConfig)"];
    const registryReader = new ethers.Contract(REGISTRY_ADDRESS, getUpkeepABI, signer);
    
    const upkeepInfo = await registryReader.getUpkeep(upkeepID);
    console.log("\n📊 Status do Upkeep:");
    console.log("Contrato:", upkeepInfo.target);
    console.log("Gas Limit:", upkeepInfo.executeGas.toString());
    console.log("Saldo:", ethers.formatEther(upkeepInfo.balance), "LINK");
    console.log("Admin:", upkeepInfo.admin);
    console.log("Pausado:", upkeepInfo.paused);

  } catch (error) {
    console.error("\n❌ Erro durante o registro:");
    console.error(error);
    
    // Log detalhado do erro
    if (error.receipt) {
      console.error("\nDetalhes da transação:");
      console.error("Hash:", error.receipt.hash);
      console.error("Status:", error.receipt.status);
      console.error("Gas Usado:", error.receipt.gasUsed.toString());
      console.error("Bloco:", error.receipt.blockNumber);
    }
    
    process.exit(1);
  }
}

main(); 