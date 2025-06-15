import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { Protocol, Position, PortfolioAnalysis, NetworkInfo } from '../types/blockchain';

// Import ABIs
import RiskRegistryABI from '../contracts/abis/RiskRegistry.json';
import PortfolioAnalyzerABI from '../contracts/abis/PortfolioAnalyzer.json';

export class BlockchainService {
  private provider: JsonRpcProvider;
  private riskRegistry!: Contract; // Use definite assignment assertion
  private portfolioAnalyzer!: Contract; // Use definite assignment assertion
  private isConnected: boolean = false;

  constructor() {
    this.provider = new JsonRpcProvider(config.sepoliaRpcUrl);
    this.initializeContracts();
  }

  private initializeContracts(): void {
    try {
      this.riskRegistry = new Contract(
        config.contracts.riskRegistry,
        RiskRegistryABI,
        this.provider
      );
      
      this.portfolioAnalyzer = new Contract(
        config.contracts.portfolioAnalyzer,
        PortfolioAnalyzerABI,
        this.provider
      );
      
      logger.info('🔗 Blockchain contracts initialized');
    } catch (error) {
      logger.error('Failed to initialize contracts:', error);
      throw new Error('Blockchain service initialization failed');
    }
  }

  async connect(): Promise<boolean> {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      this.isConnected = true;
      logger.info(`✅ Connected to Sepolia. Block: ${blockNumber}`);
      return true;
    } catch (error) {
      logger.error('Failed to connect to blockchain:', error);
      this.isConnected = false;
      return false;
    }
  }

  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();
      
      return {
        name: network.name,
        chainId: Number(network.chainId),
        blockNumber
      };
    } catch (error) {
      logger.error('Error getting network info:', error);
      throw new Error('Failed to get network information');
    }
  }

  async getAllProtocols(): Promise<Protocol[]> {
    try {
      logger.info('📋 Fetching all protocols from blockchain...');
      
      const protocolAddresses: string[] = await this.riskRegistry.getAllProtocols();
      logger.info(`Found ${protocolAddresses.length} protocols`);
      
      const protocols: Protocol[] = [];

      for (const address of protocolAddresses) {
        try {
          const protocolData = await this.riskRegistry.protocols(address);
          
          const protocol: Protocol = {
            address,
            name: protocolData.name,
            category: protocolData.category,
            tvl: formatUnits(protocolData.tvl || 0, 18),
            riskMetrics: {
              volatilityScore: Number(protocolData.riskMetrics.volatilityScore),
              liquidityScore: Number(protocolData.riskMetrics.liquidityScore),
              smartContractScore: Number(protocolData.riskMetrics.smartContractScore),
              governanceScore: Number(protocolData.riskMetrics.governanceScore),
              overallRisk: Number(protocolData.riskMetrics.overallRisk),
              lastUpdated: Number(protocolData.riskMetrics.lastUpdated),
              isActive: protocolData.riskMetrics.isActive
            },
            isWhitelisted: protocolData.isWhitelisted
          };
          
          protocols.push(protocol);
          logger.info(`✅ Loaded protocol: ${protocol.name} (${address})`);
          
        } catch (error) {
          logger.error(`Failed to load protocol ${address}:`, error);
        }
      }

      logger.info(`📊 Successfully loaded ${protocols.length} protocols`);
      return protocols;
      
    } catch (error) {
      logger.error('Error getting protocols:', error);
      throw new Error('Failed to fetch protocols from blockchain');
    }
  }

  async getProtocol(address: string): Promise<Protocol | null> {
    try {
      logger.info(`🔍 Fetching protocol: ${address}`);
      
      const protocolData = await this.riskRegistry.protocols(address);
      
      if (protocolData.protocolAddress === '0x0000000000000000000000000000000000000000') {
        logger.warn(`Protocol not found: ${address}`);
        return null;
      }

      const protocol: Protocol = {
        address,
        name: protocolData.name,
        category: protocolData.category,
        tvl: formatUnits(protocolData.tvl || 0, 18),
        riskMetrics: {
          volatilityScore: Number(protocolData.riskMetrics.volatilityScore),
          liquidityScore: Number(protocolData.riskMetrics.liquidityScore),
          smartContractScore: Number(protocolData.riskMetrics.smartContractScore),
          governanceScore: Number(protocolData.riskMetrics.governanceScore),
          overallRisk: Number(protocolData.riskMetrics.overallRisk),
          lastUpdated: Number(protocolData.riskMetrics.lastUpdated),
          isActive: protocolData.riskMetrics.isActive
        },
        isWhitelisted: protocolData.isWhitelisted
      };

      logger.info(`✅ Protocol loaded: ${protocol.name}`);
      return protocol;
      
    } catch (error) {
      logger.error(`Error getting protocol ${address}:`, error);
      throw new Error('Failed to fetch protocol data');
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.provider.getBlockNumber();
      return true;
    } catch (error) {
      logger.error('Blockchain health check failed:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const blockchainService = new BlockchainService();
