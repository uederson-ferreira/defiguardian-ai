import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber } from "ethers";

// @ts-ignore
const hre = require("hardhat");

async function main() {
  // Endereços oficiais do CCIP baseados na documentação oficial
  const ROUTER_ADDRESS = "0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59"; // Router Sepolia oficial v1.5+
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // LINK Token Sepolia
  const RECEIVER_ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";
  
  // Chain selector oficial para Avalanche Fuji (formato hexadecimal)
  const FUJI_CHAIN_SELECTOR = "14767482510784806043"; // Valor decimal oficial da documentação

  console.log("\n=== Estimando taxas do CCIP ===");
  console.log("Router Address:", ROUTER_ADDRESS);
  console.log("LINK Address:", LINK_ADDRESS);
  console.log("Chain Selector Fuji (decimal):", FUJI_CHAIN_SELECTOR);
  console.log("Receiver Address:", RECEIVER_ADDRESS);

  // ABI oficial do Router CCIP
  const routerAbi = [
    "function getFee(uint64 destinationChainSelector, (bytes receiver, bytes data, (address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) view returns (uint256)",
    "function getSupportedTokens(uint64 chainSelector) view returns (address[] tokens)",
    "function isChainSupported(uint64 chainSelector) view returns (bool supported)"
  ];

  try {
    const signer = (await hre.ethers.getSigners())[0];
    console.log("Usando signer:", signer.address);

    // Criar instância do contrato Router
    const router = new hre.ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);
    console.log("Router contract instanciado");

    // Verificar se a cadeia de destino é suportada
    const chainSelectorBN = BigNumber.from(FUJI_CHAIN_SELECTOR);
    console.log("Chain Selector (BigNumber):", chainSelectorBN.toString());

    console.log("\n--- Verificando suporte à cadeia ---");
    try {
      const isSupported = await router.isChainSupported(chainSelectorBN);
      console.log("Cadeia Fuji suportada:", isSupported);
    } catch (error) {
      console.log("Não foi possível verificar suporte da cadeia:", error.message);
    }

    // Verificar tokens suportados
    console.log("\n--- Verificando tokens suportados ---");
    try {
      const supportedTokens = await router.getSupportedTokens(chainSelectorBN);
      console.log("Tokens suportados para Fuji:", supportedTokens);
    } catch (error) {
      console.log("Erro ao obter tokens suportados:", error.message);
    }

    // Verificar saldo LINK
    console.log("\n--- Verificando saldo LINK ---");
    const linkAbi = ["function balanceOf(address) view returns (uint256)"];
    const linkContract = new hre.ethers.Contract(LINK_ADDRESS, linkAbi, signer);
    const linkBalance = await linkContract.balanceOf(signer.address);
    console.log("Saldo LINK:", hre.ethers.utils.formatEther(linkBalance), "LINK");

    // Estruturar a mensagem CCIP conforme a documentação oficial
    const message = {
      receiver: hre.ethers.utils.hexZeroPad(RECEIVER_ADDRESS, 32), // bytes32 format
      data: "0x", // dados vazios
      tokenAmounts: [], // sem tokens sendo enviados
      feeToken: LINK_ADDRESS, // pagar taxa em LINK
      extraArgs: "0x" // argumentos extras vazios
    };

    console.log("\n--- Estrutura da mensagem CCIP ---");
    console.log("Receiver (bytes32):", message.receiver);
    console.log("Data:", message.data);
    console.log("Token Amounts:", message.tokenAmounts);
    console.log("Fee Token:", message.feeToken);
    console.log("Extra Args:", message.extraArgs);

    // Tentar estimar a taxa
    console.log("\n--- Estimando taxa ---");
    try {
      const fee = await router.getFee(chainSelectorBN, message);
      console.log("✅ Taxa estimada com SUCESSO!");
      console.log("Taxa CCIP (wei):", fee.toString());
      console.log("Taxa CCIP (LINK):", hre.ethers.utils.formatEther(fee));
    } catch (error) {
      console.error("❌ Erro ao estimar taxa:", error.message);
      
      // Tentar com receiver em formato address padrão
      console.log("\n--- Tentando com receiver em formato address padrão ---");
      const messageAlt = {
        receiver: hre.ethers.utils.hexlify(hre.ethers.utils.toUtf8Bytes(RECEIVER_ADDRESS)),
        data: "0x",
        tokenAmounts: [],
        feeToken: LINK_ADDRESS,
        extraArgs: "0x"
      };

      try {
        const fee = await router.getFee(chainSelectorBN, messageAlt);
        console.log("✅ Taxa estimada com formato alternativo!");
        console.log("Taxa CCIP (wei):", fee.toString());
        console.log("Taxa CCIP (LINK):", hre.ethers.utils.formatEther(fee));
      } catch (error2) {
        console.error("❌ Erro com formato alternativo:", error2.message);
        
        // Debug adicional
        console.log("\n--- Debug adicional ---");
        console.log("Dados da transação que falharam:");
        console.log("Chain Selector:", chainSelectorBN.toString());
        console.log("Message Object:", JSON.stringify(messageAlt, null, 2));
      }
    }

  } catch (error) {
    console.error("❌ Erro geral:", error.message);
    process.exit(1);
  }
}

main()
  .then(() => {
    console.log("\n✅ Script executado com sucesso!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erro fatal:", error);
    process.exit(1);
  }); 