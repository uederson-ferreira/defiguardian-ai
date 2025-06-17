import { HardhatRuntimeEnvironment } from "hardhat/types";
import "@nomiclabs/hardhat-ethers";
import * as hre from "hardhat";

// @ts-ignore: Hardhat Runtime Environment's members are not typed properly
const ethers = hre.ethers;

async function main() {
  // Endereços importantes
  const HEDGE_CONTRACT = "0x36984C5c68612Ce06C547B587D867EE096A7469c";
  const ROUTER_ADDRESS = "0xD0daae2231E9CB96b94C8512223533293C3693Bf"; // Router CCIP na Sepolia
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // LINK token na Sepolia
  
  // Chain Selectors do CCIP
  const FUJI_CHAIN_SELECTOR = ethers.BigNumber.from("14767482510784806043"); // Avalanche Fuji testnet
  const RECEIVER_ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9"; // Endereço na Fuji
  
  console.log("\nIniciando envio de mensagem cross-chain...");
  
  // Conecta ao contrato
  const [signer] = await ethers.getSigners();
  console.log("Signer address:", signer.address);
  
  const CrossChainHedge = await ethers.getContractFactory("CrossChainHedge");
  const hedge = await CrossChainHedge.attach(HEDGE_CONTRACT);
  
  // Prepara a mensagem de teste
  const testMessage = ethers.utils.defaultAbiCoder.encode(
    ["string"],
    ["TEST_MESSAGE"]
  );
  
  console.log("\nMensagem codificada:", testMessage);
  console.log("Destinatário:", RECEIVER_ADDRESS);
  console.log("Chain Selector:", FUJI_CHAIN_SELECTOR.toString());
  
  try {
    console.log("\nEnviando mensagem de teste...");
    const tx = await hedge.sendMessage(
      FUJI_CHAIN_SELECTOR,
      RECEIVER_ADDRESS,
      testMessage,
      {
        gasLimit: 500000
      }
    );
    
    console.log(`\nTransação enviada: ${tx.hash}`);
    console.log("\nAguardando confirmação...");
    
    const receipt = await tx.wait();
    console.log(`\nTransação confirmada no bloco ${receipt.blockNumber}`);
    
    // Verifica se o evento MessageSent foi emitido
    const messageSentEvent = receipt.events?.find(
      (e: any) => e.event === "MessageSent"
    );
    
    if (messageSentEvent) {
      console.log("\nMensagem enviada com sucesso!");
      console.log("MessageId:", messageSentEvent.args.messageId);
      console.log("\nVerifique a mensagem no CCIP Explorer:");
      console.log(`https://ccip.chain.link/msg/${messageSentEvent.args.messageId}`);
    } else {
      console.log("\nAtenção: Evento MessageSent não encontrado no recibo da transação");
    }
  } catch (error: any) {
    console.error("\nErro ao enviar mensagem:", error);
    if (error.error) {
      console.error("Detalhes do erro:", error.error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 