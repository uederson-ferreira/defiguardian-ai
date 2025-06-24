// elizaos-agent/src/index.ts - Configuração Principal DefiGuardian AI
import {
  logger,
  type Character,
  type IAgentRuntime,
  type Project,
  type ProjectAgent,
} from '@elizaos/core';

import { riskGuardianCharacter } from '../characters/defiguardian.character';
import { contractActions } from './actions/contractInteraction';

// Forçar desabilitação de embeddings para performance
process.env.SKIP_EMBEDDINGS = 'true';
process.env.USE_EMBEDDINGS = 'false';
process.env.TEXT_MODEL_PROVIDER = 'openrouter';
process.env.EMBEDDING_MODEL_PROVIDER = 'none';

// Plugin para ações do DefiGuardian
export const riskGuardianPlugin = {
  name: 'defiguardian',
  description: 'DefiGuardian blockchain risk management actions',
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
    
    // Configurações específicas do blockchain - Avalanche Fuji
    blockchain: {
      network: "fuji",
      rpcUrl: process.env.FUJI_RPC_URL || "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      contracts: {
        riskRegistry: process.env.CONTRACT_RISK_REGISTRY || "0xF404b05B55850cBaC8891c9Db1524Fc1D437124C",
        portfolioAnalyzer: process.env.CONTRACT_PORTFOLIO_ANALYZER || "0x1e60Cf3CA97866ddC6cb640D169061da9Fe04192",
        riskOracle: process.env.CONTRACT_RISK_ORACLE || "0x14Ca6F2BEd3FC051E1E8f409D04369A75894a4A8",
        alertSystem: process.env.CONTRACT_ALERT_SYSTEM || "0xe46F4AcC01B4664c50E421dBb50343096be05Ecc",
        riskInsurance: process.env.CONTRACT_RISK_INSURANCE || "0x6021d94b73D1b4b0515902BEa7bf17cE3dDa2e8F",
        contractRegistry: process.env.CONTRACT_REGISTRY || "0xA65647C7335835F477831E4E907aBaA1560646a8",
        riskGuardianMaster: process.env.RISK_GUARDIAN_MASTER || "0x00F4Ce590406031E88666BF1Fd1310A809a8A3a0"
      }
    }
  }
};

// Função de inicialização do character
const initDefiGuardianCharacter = async ({ runtime }: { runtime: IAgentRuntime }) => {
  logger.info('🛡️ Initializing DefiGuardian AI Character');
  logger.info('🤖 Agent: Elisa - DeFi Risk Analysis Expert');
  logger.info('📝 Text Model:', process.env.OPENROUTER_MODEL || "deepseek/deepseek-r1-0528-qwen3-8b:free");
  logger.info('🧠 Embeddings: DISABLED for performance');
  logger.info('💰 DeFi Analysis: ENABLED with smart contract integration');
  logger.info('⛓️ Blockchain: Avalanche Fuji testnet');
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

  logger.info('✅ DefiGuardian AI initialization complete');
  logger.info('🚀 Ready to analyze DeFi risks with smart contract data');
};

// Agent project configuration
export const projectAgent: ProjectAgent = {
  character,
  init: async (runtime: IAgentRuntime) => await initDefiGuardianCharacter({ runtime }),
};

// Project definition
const project: Project = {
  agents: [projectAgent],
};

export default project;

// elizaos-agent/package.json atualizado
/*
{
  "name": "defiguardian-elizaos-agent",
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