import { HardhatRuntimeEnvironment } from "hardhat/types";
import { BigNumber } from "ethers";

// @ts-ignore
const hre = require("hardhat");

async function main() {
  const ROUTER_ADDRESS = "0xD0daae2231E9CB96b94C8512223533293C3693Bf"; // Sepolia
  const LINK_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789"; // Sepolia LINK
  const FUJI_CHAIN_SELECTOR = "14767482510784806043"; // Avalanche Fuji testnet
  const RECEIVER_ADDRESS = "0xE8f35A0B15AD587E1b0967BCc2024dE834667dC9";

  console.log("\nEstimando taxas do CCIP...");

  // ABI simplificado com o formato da struct inline
  const routerAbi = [
    "function getFee(uint64 destinationChainSelector, tuple(bytes receiver, bytes data, tuple(address token, uint256 amount)[] tokenAmounts, address feeToken, bytes extraArgs) message) view returns (uint256)"
  ];

  const signer = await hre.ethers.getSigner();
  const router = new hre.ethers.Contract(ROUTER_ADDRESS, routerAbi, signer);

  try {
    // Prepara os argumentos extras
    const EVM_EXTRA_ARGS_V1_TAG = "0x97a657c9";
    const extraArgs = hre.ethers.utils.hexConcat([
      EVM_EXTRA_ARGS_V1_TAG,
      hre.ethers.utils.defaultAbiCoder.encode(
        ["uint256", "bool"],
        [200000, false]
      )
    ]);

    // Prepara o receiver no formato correto do CCIP
    const receiverBytes = hre.ethers.utils.defaultAbiCoder.encode(
      ["address"],
      [RECEIVER_ADDRESS]
    );

    // Prepara a mensagem no formato correto
    const message = {
      receiver: receiverBytes,
      data: "0x",
      tokenAmounts: [],
      feeToken: LINK_ADDRESS,
      extraArgs: extraArgs
    };

    // Converte o chain selector para uint64
    const chainSelector = BigNumber.from(FUJI_CHAIN_SELECTOR).toHexString();
    console.log("Chain Selector:", chainSelector);
    console.log("Receiver Bytes:", receiverBytes);
    console.log("Mensagem:", message);

    const fee = await router.getFee(chainSelector, message);
    console.log(`\nTaxas estimadas: ${hre.ethers.utils.formatUnits(fee, 18)} LINK`);
  } catch (error: any) {
    console.error("\nErro ao estimar taxas:", error);
    if (error.data) {
      console.error("Dados do erro:", error.data);
    }
    if (error.transaction) {
      console.error("Transação:", error.transaction);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 