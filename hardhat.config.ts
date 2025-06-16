import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.19",
  networks: {
    sepolia: {
      url: "https://eth-sepolia.g.alchemy.com/v2/zETrtjhUX30u8cU9hhTTC",
      accounts: ["87797c90c907ad1c5390d5d05ff658b5b41cc2d62eed8757e84a6b99b8512132"]
    }
  },
  paths: {
    sources: "./interfaces" // Apenas compilar as interfaces que precisamos
  }
};

export default config; 