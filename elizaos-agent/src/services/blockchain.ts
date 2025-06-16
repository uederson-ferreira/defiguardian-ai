import { createPublicClient, http } from 'viem';
import { mainnet, polygon, bsc, avalanche } from 'viem/chains';
import { config } from '../config/env';

// Create clients for different chains
const ethereumClient = createPublicClient({
  chain: mainnet,
  transport: http(config.ethereum.rpcUrl)
});

const polygonClient = createPublicClient({
  chain: polygon,
  transport: http(config.polygon.rpcUrl)
});

const bscClient = createPublicClient({
  chain: bsc,
  transport: http(config.bsc.rpcUrl)
});

const avalancheClient = createPublicClient({
  chain: avalanche,
  transport: http(config.avalanche.rpcUrl)
});

// Helper function to convert BigInt to string
const formatBalance = (balance: bigint): string => {
  return balance.toString();
};

export const blockchainService = {
  async getEthereumBalance(address: string) {
    const balance = await ethereumClient.getBalance({ 
      address: address as `0x${string}` 
    });
    return formatBalance(balance);
  },

  async getPolygonBalance(address: string) {
    const balance = await polygonClient.getBalance({ 
      address: address as `0x${string}` 
    });
    return formatBalance(balance);
  },

  async getBscBalance(address: string) {
    const balance = await bscClient.getBalance({ 
      address: address as `0x${string}` 
    });
    return formatBalance(balance);
  },

  async getAvalancheBalance(address: string) {
    const balance = await avalancheClient.getBalance({ 
      address: address as `0x${string}` 
    });
    return formatBalance(balance);
  },

  async getEthereumGasPrice() {
    const gasPrice = await ethereumClient.getGasPrice();
    return formatBalance(gasPrice);
  },

  async getPolygonGasPrice() {
    const gasPrice = await polygonClient.getGasPrice();
    return formatBalance(gasPrice);
  },

  async getBscGasPrice() {
    const gasPrice = await bscClient.getGasPrice();
    return formatBalance(gasPrice);
  },

  async getAvalancheGasPrice() {
    const gasPrice = await avalancheClient.getGasPrice();
    return formatBalance(gasPrice);
  }
};