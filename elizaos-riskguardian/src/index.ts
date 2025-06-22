// elizaos-agent/src/index.ts - Configuração Principal RiskGuardian AI
import {
  logger,
  type Character,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from '@elizaos/core';

import { riskGuardianCharacter } from '../characters/riskguardian.character';
import { contractActions } from './actions/contractInteraction';

// Forçar desabilitação de embeddings para performance
process.env.SKIP_EMBEDDINGS = 'true';
process.env.USE_EMBEDDINGS = 'false';
process.env.TEXT_MODEL_PROVIDER = 'openrouter';
process.env.EMBEDDING_MODEL_PROVIDER = 'none';

// Plugin para ações do RiskGuardian
export const riskGuardianPlugin = {
  name: 'riskguardian',
  description: 'RiskGuardian blockchain risk management actions',
  actions: contractActions,
  providers: [],
  services: [],
};

// Character configurado com ações de contrato
export const character: Character = {
  ...riskGuardianCharacter,
  
  // Plugins essenciais
  plugins: [
    '@elizaos/plugin-openrouter',  // Modelo de IA
    '@elizaos/plugin-sql',         // Banco de dados
    '@elizaos/plugin-bootstrap',   // Funcionalidades básicas
  ],

  // Configurações de runtime
  settings: {
    secrets: {
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    },
    model: process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1-0528-qwen3-8b:free",
    temperature: 0.1,
    maxTokens: 4000,
    
    // Otimizações de performance
    skipEmbeddings: true,
    useEmbeddings: false,
    skipMemoryEmbeddings: true,
    
    // Configurações específicas do blockchain
    blockchain: {
      network: "sepolia",
      rpcUrl: process.env.SEPOLIA_RPC_URL || "https://sepolia.drpc.org",
      chainId: 11155111,
      contracts: {
        riskRegistry: process.env.CONTRACT_RISK_REGISTRY || "0x1B7E83b953d6D4e3e6EB5be6039D079E22A375Be",
        portfolioAnalyzer: process.env.CONTRACT_PORTFOLIO_ANALYZER || "0x68532091c3C02092804a028e0109091781Cd1bdA",
        riskOracle: process.env.CONTRACT_RISK_ORACLE || "0x12d10085441a0257aDd5b71c831C61b880EF0569",
        alertSystem: process.env.CONTRACT_ALERT_SYSTEM || "0x532Dedf68DA445ed37cFaf74C4e3245101190ad1",
        riskInsurance: process.env.CONTRACT_RISK_INSURANCE || "0xc757ad750Bb5Ca01Fb8D4151449E7AF8C1E01527"
      }
    }
  }
};

// Função de inicialização do character
const initRiskGuardianCharacter = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('🛡️ Initializing RiskGuardian AI Character');
  logger.info('🤖 Agent: Elisa - DeFi Risk Analysis Expert');
  logger.info('📝 Text Model:', process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1-0528-qwen3-8b:free");
  logger.info('🧠 Embeddings: DISABLED for performance');
  logger.info('💰 DeFi Analysis: ENABLED with smart contract integration');
  logger.info('⛓️ Blockchain: Sepolia testnet');
  logger.info('📊 Contracts: Risk Registry, Portfolio Analyzer, Risk Oracle');
  
  // Patch runtime para desabilitar embeddings
  if (runtime.addEmbeddingToMemory) {
    const originalMethod = runtime.addEmbeddingToMemory;
    runtime.addEmbeddingToMemory = async (...args: any[]) => {
      logger.debug('🚫 Embedding generation skipped (disabled for performance)');
      return originalMethod.apply(runtime, args);
    };
  }

  // Log das configurações de contratos
  const blockchain = character.settings?.blockchain as any;
  const contracts = blockchain?.contracts;
  if (contracts) {
    logger.info('📋 Smart Contract Addresses:');
    logger.info(`   Risk Registry: ${contracts.riskRegistry}`);
    logger.info(`   Portfolio Analyzer: ${contracts.portfolioAnalyzer}`);
    logger.info(`   Risk Oracle: ${contracts.riskOracle}`);
    logger.info(`   Alert System: ${contracts.alertSystem}`);
    logger.info(`   Risk Insurance: ${contracts.riskInsurance}`);
  }

  // Log das ações disponíveis
  if (contractActions.length > 0) {
    logger.info('⚡ Available Contract Actions:');
    contractActions.forEach(action => {
      logger.info(`   - ${action.name}: ${action.description}`);
    });
  }

  logger.info('✅ RiskGuardian AI initialization complete');
  logger.info('🚀 Ready to analyze DeFi risks with smart contract data');
};

// Agent project configuration
export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initRiskGuardianCharacter({ runtime }),
};

// Project definition
const project: Project = {
  agents: [projectAgent],
};

export default project;

// elizaos-agent/package.json atualizado
/*
{
  "name": "riskguardian-elizaos-agent",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "bun run src/index.ts",
    "build": "bun build src/index.ts --outdir dist",
    "dev": "bun --watch run src/index.ts",
    "test": "bun test"
  },
  "dependencies": {
    "@elizaos/core": "latest",
    "@elizaos/plugin-openrouter": "latest",
    "@elizaos/plugin-sql": "latest", 
    "@elizaos/plugin-bootstrap": "latest",
    "ethers": "^6.8.0",
    "axios": "^1.6.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "node": ">=20.0.0"
  }
*/