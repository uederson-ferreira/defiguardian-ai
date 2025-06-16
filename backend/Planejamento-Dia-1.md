# 📅 DIA 1: Setup + Blockchain Integration

## ⏰ **Cronograma (8h)**

### 🌅 **MANHÃ (4h) - Setup & Environment**

#### **📦 Fase 1.1: Project Setup (1h)**

##### **📋 Tarefas:**
1. **Criar estrutura do projeto**
2. **Configurar TypeScript + Node.js**
3. **Instalar dependências essenciais**
4. **Configurar ambiente de desenvolvimento**

##### **🔧 Comandos de Execução:**
```bash
# 1. Criar diretório e entrar
mkdir riskguardian-backend
cd riskguardian-backend

# 2. Inicializar projeto Node.js
npm init -y

# 3. Instalar TypeScript e ferramentas básicas
npm install -D typescript @types/node ts-node nodemon
npm install -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier eslint

# 4. Configurar TypeScript
npx tsc --init
```

##### **📄 Arquivos a Criar:**

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**package.json (adicionar scripts):**
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon src/index.ts",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  }
}
```

##### **✅ Validação da Fase 1.1:**
```bash
# Teste se TypeScript está funcionando
echo 'console.log("Hello TypeScript");' > test.ts
npx ts-node test.ts
rm test.ts

# Deve imprimir: Hello TypeScript
```

---

#### **🌐 Fase 1.2: Core Dependencies (1h)**

##### **📋 Tarefas:**
1. **Instalar Express + middleware essenciais**
2. **Instalar ethers.js para blockchain**
3. **Instalar Prisma para database**
4. **Configurar variáveis de ambiente**

##### **🔧 Comandos de Execução:**
```bash
# 1. Express e middleware
npm install express cors helmet morgan dotenv
npm install -D @types/express @types/cors @types/morgan

# 2. Blockchain integration
npm install ethers@^6.0.0

# 3. Database ORM
npm install prisma @prisma/client

# 4. Security & validation
npm install zod jsonwebtoken bcryptjs express-rate-limit
npm install -D @types/jsonwebtoken @types/bcryptjs

# 5. Logging
npm install winston

# 6. Redis para cache
npm install redis@^4.0.0
npm install -D @types/redis

# 7. Testing
npm install -D jest @types/jest supertest @types/supertest
```

##### **📁 Estrutura de Diretórios:**
```bash
mkdir -p src/{config,controllers,middleware,services,routes,types,utils}
mkdir -p src/contracts/{abis,addresses}
mkdir -p tests
mkdir -p logs
mkdir -p prisma
```

##### **📄 Arquivo de Ambiente (.env):**
```bash
# Criar arquivo .env
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=development
PORT=8000
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/riskguardian?schema=public"
REDIS_URL="redis://localhost:6379"

# Blockchain - Sepolia Testnet  
SEPOLIA_CHAIN_ID=11155111
SEPOLIA_RPC_URL=https://sepolia.drpc.org
ETHERSCAN_API_KEY=

# Smart Contracts (SEUS CONTRATOS JÁ DEPLOYADOS)
RISK_REGISTRY_ADDRESS=0x1B7E83b953d6D4e3e6EB5be6039D079E22A375Be
RISK_ORACLE_ADDRESS=0x12d10085441a0257aDd5b71c831C61b880EF0569
PORTFOLIO_ANALYZER_ADDRESS=0x68532091c3C02092804a028e0109091781Cd1bdA
RISK_INSURANCE_ADDRESS=0xc757ad750Bb5Ca01Fb8D4151449E7AF8C1E01527
ALERT_SYSTEM_ADDRESS=0x532Dedf68DA445ed37cFaf74C4e3245101190ad1

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-change-this-in-production-min-32-chars
JWT_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
EOF
```

##### **✅ Validação da Fase 1.2:**
```bash
# Verificar se todas as dependências foram instaladas
npm list --depth=0

# Deve mostrar express, ethers, prisma, etc.
```

---

#### **🗄️ Fase 1.3: Database Setup (1h)**

##### **📋 Tarefas:**
1. **Configurar Prisma schema**
2. **Definir modelos de dados**
3. **Configurar PostgreSQL**
4. **Executar primeira migração**

##### **🔧 Configuração Prisma:**
```bash
# 1. Inicializar Prisma
npx prisma init
```

##### **📄 Schema do Banco (prisma/schema.prisma):**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  address   String   @unique
  nonce     String   @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  portfolios Portfolio[]
  insurancePolicies InsurancePolicy[]
  alertSubscriptions AlertSubscription[]

  @@map("users")
}

model Portfolio {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  name        String?
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Cached analytics
  lastRiskScore        Int?      // Basis points
  lastTotalValue       Decimal?  // USD value
  lastDiversification  Int?      // Diversification score
  lastAnalysisAt       DateTime?

  @@map("portfolios")
}

model InsurancePolicy {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Policy details
  coverageAmount  Decimal
  premium         Decimal
  riskThreshold   Int      // Basis points
  duration        Int      // Seconds
  
  // Status
  isActive    Boolean   @default(true)
  hasClaimed  Boolean   @default(false)
  claimedAt   DateTime?
  payoutAmount Decimal?

  // Blockchain data
  policyId      String    // On-chain policy ID
  txHash        String?   // Creation transaction
  claimTxHash   String?   // Claim transaction
  
  createdAt DateTime @default(now())
  expiresAt DateTime

  @@map("insurance_policies")
}

model AlertSubscription {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  alertType       Int     // 0=RISK_THRESHOLD, 1=LIQUIDATION_WARNING, etc.
  protocolAddress String?
  threshold       Int     // Basis points
  isActive        Boolean @default(true)
  
  cooldownMinutes  Int     @default(60)
  lastTriggeredAt  DateTime?
  
  createdAt DateTime @default(now())

  @@map("alert_subscriptions")
}

model CacheEntry {
  id        String   @id @default(cuid())
  key       String   @unique
  value     Json
  expiresAt DateTime
  createdAt DateTime @default(now())

  @@map("cache_entries")
}
```

##### **🔧 Comandos Database:**
```bash
# 1. Gerar cliente Prisma
npx prisma generate

# 2. Executar migração (se PostgreSQL estiver rodando)
npx prisma migrate dev --name init

# 3. Abrir Prisma Studio para visualizar
npx prisma studio
```

##### **⚠️ IMPORTANTE - PostgreSQL:**
Se você não tiver PostgreSQL rodando ainda:
```bash
# Opção 1: Docker (recomendado)
docker run --name postgres-riskguardian \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=riskguardian \
  -p 5432:5432 \
  -d postgres:15

# Opção 2: Usar o Docker Compose que você já tem
cd ../  # Volta para o diretório principal do projeto
docker-compose up -d postgres
```

##### **✅ Validação da Fase 1.3:**
```bash
# Verificar se consegue conectar no banco
npx prisma db seed

# Deve conectar sem erro (mesmo se não tiver dados)
```

---

#### **🔧 Fase 1.4: Basic Server Setup (1h)**

##### **📋 Tarefas:**
1. **Criar servidor Express básico**
2. **Configurar middleware essenciais**
3. **Criar sistema de configuração**
4. **Implementar logging**

##### **📄 Configuration (src/config/environment.ts):**
```typescript
import dotenv from 'dotenv';
dotenv.config();

export const config = {
  // Server
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '8000'),
  apiPrefix: process.env.API_PREFIX || '/api',
  
  // Database
  databaseUrl: process.env.DATABASE_URL!,
  redisUrl: process.env.REDIS_URL!,
  
  // Blockchain
  sepoliaChainId: parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111'),
  sepoliaRpcUrl: process.env.SEPOLIA_RPC_URL!,
  
  // Smart Contracts (SEUS ENDEREÇOS)
  contracts: {
    riskRegistry: process.env.RISK_REGISTRY_ADDRESS!,
    riskOracle: process.env.RISK_ORACLE_ADDRESS!,
    portfolioAnalyzer: process.env.PORTFOLIO_ANALYZER_ADDRESS!,
    riskInsurance: process.env.RISK_INSURANCE_ADDRESS!,
    alertSystem: process.env.ALERT_SYSTEM_ADDRESS!,
  },
  
  // Auth
  jwtSecret: process.env.JWT_SECRET!,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  
  // CORS
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  logFile: process.env.LOG_FILE || 'logs/app.log',
};

// Validation
const requiredEnvVars = [
  'DATABASE_URL',
  'SEPOLIA_RPC_URL',
  'RISK_REGISTRY_ADDRESS',
  'PORTFOLIO_ANALYZER_ADDRESS',
  'JWT_SECRET'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}
```

##### **📄 Logger (src/utils/logger.ts):**
```typescript
import winston from 'winston';
import { config } from '../config/environment';

const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message} ${
      Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''
    }`;
  })
);

export const logger = winston.createLogger({
  level: config.logLevel,
  format: customFormat,
  defaultMeta: { service: 'riskguardian-api' },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: config.logFile 
    }),
  ],
});

if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    )
  }));
}
```

##### **📄 Basic Server (src/index.ts):**
```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { config } from './config/environment';
import { logger } from './utils/logger';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors({
  origin: config.allowedOrigins,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: { error: 'Too many requests from this IP' }
});
app.use(limiter);

// Parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging
app.use(morgan('combined', { 
  stream: { 
    write: (message: string) => logger.info(message.trim()) 
  } 
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: config.nodeEnv
  });
});

// Temporary root route
app.get('/', (req, res) => {
  res.json({
    message: 'RiskGuardian AI Backend API',
    version: '1.0.0',
    docs: '/api/docs',
    health: '/health'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.originalUrl 
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: config.nodeEnv === 'development' ? err.message : 'Something went wrong'
  });
});

const server = app.listen(config.port, () => {
  logger.info(`🚀 RiskGuardian API running on port ${config.port}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Blockchain: Sepolia (${config.sepoliaChainId})`);
  logger.info(`📄 Health check: http://localhost:${config.port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
```

##### **🔧 Comando para Testar:**
```bash
# 1. Criar diretório de logs
mkdir -p logs

# 2. Executar servidor
npm run dev

# 3. Em outro terminal, testar
curl http://localhost:8000/health
```

##### **✅ Validação da Fase 1.4:**
Resposta esperada:
```json
{
  "status": "ok",
  "timestamp": "2024-01-XX...",
  "version": "1.0.0",
  "environment": "development"
}
```

---

### 🌤️ **TARDE (4h) - Blockchain Integration**

#### **🔗 Fase 1.5: Contract ABIs Setup (1h)**

##### **📋 Tarefas:**
1. **Baixar ABIs dos contratos deployados**
2. **Criar interfaces TypeScript**
3. **Configurar endereços dos contratos**

##### **📄 RiskRegistry ABI (src/contracts/abis/RiskRegistry.json):**
```json
[
  "function getAllProtocols() view returns (address[])",
  "function protocols(address) view returns (string name, address protocolAddress, string category, uint256 tvl, tuple(uint256 volatilityScore, uint256 liquidityScore, uint256 smartContractScore, uint256 governanceScore, uint256 overallRisk, uint256 lastUpdated, bool isActive) riskMetrics, bool isWhitelisted)",
  "function owner() view returns (address)",
  "function riskAssessors(address) view returns (bool)"
]
```

##### **📄 PortfolioAnalyzer ABI (src/contracts/abis/PortfolioAnalyzer.json):**
```json
[
  "function calculatePortfolioRisk(address user) view returns (uint256)",
  "function getUserPositions(address user) view returns (tuple(address protocol, address token, uint256 amount, uint256 value)[])",
  "function getPortfolioAnalysis(address user) view returns (tuple(uint256 totalValue, uint256 overallRisk, uint256 diversificationScore, uint256 timestamp, bool isValid))",
  "function riskRegistry() view returns (address)"
]
```

##### **📄 Contract Addresses (src/contracts/addresses/sepolia.json):**
```json
{
  "chainId": 11155111,
  "networkName": "sepolia",
  "rpcUrl": "https://sepolia.drpc.org",
  "explorerUrl": "https://sepolia.etherscan.io",
  "contracts": {
    "RiskRegistry": "0x1B7E83b953d6D4e3e6EB5be6039D079E22A375Be",
    "RiskOracle": "0x12d10085441a0257aDd5b71c831C61b880EF0569", 
    "PortfolioRiskAnalyzer": "0x68532091c3C02092804a028e0109091781Cd1bdA",
    "RiskInsurance": "0xc757ad750Bb5Ca01Fb8D4151449E7AF8C1E01527",
    "AlertSystem": "0x532Dedf68DA445ed37cFaf74C4e3245101190ad1"
  }
}
```

##### **📄 TypeScript Types (src/types/blockchain.ts):**
```typescript
export interface Protocol {
  address: string;
  name: string;
  category: string;
  tvl: string;
  riskMetrics: {
    volatilityScore: number;
    liquidityScore: number;
    smartContractScore: number;
    governanceScore: number;
    overallRisk: number;
    lastUpdated: number;
    isActive: boolean;
  };
  isWhitelisted: boolean;
}

export interface Position {
  protocol: string;
  token: string;
  amount: string;
  value: string;
}

export interface PortfolioAnalysis {
  totalValue: string;
  overallRisk: number;
  diversificationScore: number;
  timestamp: number;
  isValid: boolean;
}

export interface NetworkInfo {
  name: string;
  chainId: number;
  blockNumber: number;
}
```

##### **✅ Validação da Fase 1.5:**
```bash
# Verificar se arquivos foram criados
ls -la src/contracts/abis/
ls -la src/contracts/addresses/
ls -la src/types/

# Deve mostrar os arquivos JSON e TypeScript
```

---

#### **⛓️ Fase 1.6: Blockchain Service Implementation (2h)**

##### **📋 Tarefas:**
1. **Implementar serviço de blockchain**
2. **Criar conexão com Sepolia**
3. **Implementar métodos para leitura dos contratos**
4. **Adicionar cache e error handling**

##### **📄 Blockchain Service (src/services/blockchain.service.ts):**
```typescript
import { Contract, JsonRpcProvider, formatUnits } from 'ethers';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { Protocol, Position, PortfolioAnalysis, NetworkInfo } from '../types/blockchain';

// Import ABIs
import RiskRegistryABI from '../contracts/abis/RiskRegistry.json';
import PortfolioAnalyzerABI from '../contracts/abis/PortfolioAnalyzer.json';

export class BlockchainService {
  private provider: JsonRpcProvider;
  private riskRegistry: Contract;
  private portfolioAnalyzer: Contract;
  private isConnected: boolean = false;

  constructor() {
    this.provider = new JsonRpcProvider(config.sepoliaRpcUrl);
    this.initializeContracts();
  }

  private initializeContracts() {
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
      
      // Check if protocol exists (address won't be zero)
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

  async getUserPositions(userAddress: string): Promise<Position[]> {
    try {
      logger.info(`📊 Fetching positions for user: ${userAddress}`);
      
      const positions = await this.portfolioAnalyzer.getUserPositions(userAddress);
      
      const formattedPositions: Position[] = positions.map((pos: any) => ({
        protocol: pos.protocol,
        token: pos.token,
        amount: formatUnits(pos.amount, 18),
        value: formatUnits(pos.value, 18)
      }));

      logger.info(`✅ Found ${formattedPositions.length} positions for user`);
      return formattedPositions;
      
    } catch (error) {
      logger.error(`Error getting positions for ${userAddress}:`, error);
      throw new Error('Failed to fetch user positions');
    }
  }

  async getPortfolioAnalysis(userAddress: string): Promise<PortfolioAnalysis | null> {
    try {
      logger.info(`📈 Fetching portfolio analysis for: ${userAddress}`);
      
      const analysis = await this.portfolioAnalyzer.getPortfolioAnalysis(userAddress);
      
      if (!analysis.isValid) {
        logger.info(`No valid portfolio analysis for user: ${userAddress}`);
        return null;
      }

      const portfolioAnalysis: PortfolioAnalysis = {
        totalValue: formatUnits(analysis.totalValue, 18),
        overallRisk: Number(analysis.overallRisk),
        diversificationScore: Number(analysis.diversificationScore),
        timestamp: Number(analysis.timestamp),
        isValid: analysis.isValid
      };

      logger.info(`✅ Portfolio analysis loaded for user`);
      return portfolioAnalysis;
      
    } catch (error) {
      logger.error(`Error getting portfolio analysis for ${userAddress}:`, error);
      throw new Error('Failed to fetch portfolio analysis');
    }
  }

  async calculatePortfolioRisk(userAddress: string): Promise<number> {
    try {
      logger.info(`🎯 Calculating portfolio risk for: ${userAddress}`);
      
      const riskScore = await this.portfolioAnalyzer.calculatePortfolioRisk(userAddress);
      const risk = Number(riskScore);
      
      logger.info(`✅ Portfolio risk calculated: ${risk} basis points`);
      return risk;
      
    } catch (error) {
      logger.error(`Error calculating portfolio risk for ${userAddress}:`, error);
      throw new Error('Failed to calculate portfolio risk');
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

// Singleton instance
export const blockchainService = new BlockchainService();
```

##### **✅ Validação da Fase 1.6:**
Criar um teste simples:
```bash
# Criar arquivo de teste temporário
cat > test-blockchain.ts << 'EOF'
import { blockchainService } from './src/services/blockchain.service';

async function test() {
  console.log('🧪 Testing blockchain connection...');
  
  const connected = await blockchainService.connect();
  console.log('Connected:', connected);
  
  const networkInfo = await blockchainService.getNetworkInfo();
  console.log('Network:', networkInfo);
  
  const protocols = await blockchainService.getAllProtocols();
  console.log('Protocols found:', protocols.length);
  
  if (protocols.length > 0) {
    console.log('First protocol:', protocols[0].name);
  }
}

test().catch(console.error);
EOF

# Executar teste
npx ts-node test-blockchain.ts

# Limpar teste
rm test-blockchain.ts
```

Saída esperada:
```
🧪 Testing blockchain connection...
Connected: true
Network: { name: 'sepolia', chainId: 11155111, blockNumber: XXXX }
Protocols found: 3
First protocol: Uniswap V3
```

---

#### **🎯 Fase 1.7: First API Endpoints (1h)**

##### **📋 Tarefas:**
1. **Criar controller para Registry**
2. **Implementar primeiras rotas**
3. **Adicionar middleware de validação**
4. **Testar endpoints básicos**

##### **📄 Registry Controller (src/controllers/registry.controller.ts):**
```typescript
import { Request, Response } from 'express';
import { blockchainService } from '../services/blockchain.service';
import { logger } from '../utils/logger';
import { z } from 'zod';

// Validation schemas
const addressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address');

export class RegistryController {
  
  async getAllProtocols(req: Request, res: Response) {
    try {
      logger.info('📋 API: Getting all protocols');
      
      const protocols = await blockchainService.getAllProtocols();
      
      res.json({
        success: true,
        data: protocols,
        count: protocols.length,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned ${protocols.length} protocols`);
      
    } catch (error) {
      logger.error('❌ API: Error in getAllProtocols:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocols',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProtocol(req: Request, res: Response) {
    try {
      const { address } = req.params;
      
      // Validate address
      const validation = addressSchema.safeParse(address);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid protocol address format',
          details: validation.error.errors
        });
      }

      logger.info(`🔍 API: Getting protocol: ${address}`);
      
      const protocol = await blockchainService.getProtocol(address);
      
      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocol not found',
          address
        });
      }

      res.json({
        success: true,
        data: protocol,
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned protocol: ${protocol.name}`);
      
    } catch (error) {
      logger.error(`❌ API: Error in getProtocol:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocol',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProtocolRisk(req: Request, res: Response) {
    try {
      const { address } = req.params;
      
      const validation = addressSchema.safeParse(address);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid protocol address format'
        });
      }

      logger.info(`🎯 API: Getting risk for protocol: ${address}`);
      
      const protocol = await blockchainService.getProtocol(address);
      
      if (!protocol) {
        return res.status(404).json({
          success: false,
          error: 'Protocol not found'
        });
      }

      // Risk level interpretation
      const overallRisk = protocol.riskMetrics.overallRisk;
      let riskLevel: string;
      if (overallRisk < 3000) riskLevel = 'LOW';
      else if (overallRisk < 6000) riskLevel = 'MEDIUM';
      else if (overallRisk < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';

      res.json({
        success: true,
        data: {
          address: protocol.address,
          name: protocol.name,
          category: protocol.category,
          riskMetrics: protocol.riskMetrics,
          riskLevel,
          riskPercentage: (overallRisk / 100).toFixed(2) + '%',
          lastUpdated: new Date(protocol.riskMetrics.lastUpdated * 1000).toISOString(),
          isActive: protocol.riskMetrics.isActive
        },
        timestamp: new Date().toISOString()
      });
      
      logger.info(`✅ API: Returned risk data for: ${protocol.name}`);
      
    } catch (error) {
      logger.error(`❌ API: Error in getProtocolRisk:`, error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch protocol risk',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getSystemHealth(req: Request, res: Response) {
    try {
      logger.info('🏥 API: Checking system health');
      
      const blockchainHealthy = await blockchainService.healthCheck();
      const networkInfo = blockchainHealthy ? await blockchainService.getNetworkInfo() : null;
      
      const health = {
        status: blockchainHealthy ? 'healthy' : 'unhealthy',
        blockchain: {
          connected: blockchainHealthy,
          network: networkInfo?.name || 'disconnected',
          chainId: networkInfo?.chainId || null,
          blockNumber: networkInfo?.blockNumber || null
        },
        api: {
          status: 'healthy',
          version: '1.0.0',
          uptime: process.uptime()
        },
        timestamp: new Date().toISOString()
      };

      const statusCode = blockchainHealthy ? 200 : 503;
      
      res.status(statusCode).json({
        success: blockchainHealthy,
        data: health
      });
      
      logger.info(`✅ API: Health check completed - ${health.status}`);
      
    } catch (error) {
      logger.error('❌ API: Error in getSystemHealth:', error);
      res.status(503).json({
        success: false,
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

##### **📄 Routes (src/routes/registry.routes.ts):**
```typescript
import { Router } from 'express';
import { RegistryController } from '../controllers/registry.controller';

const router = Router();
const registryController = new RegistryController();

// Registry routes
router.get('/protocols', registryController.getAllProtocols.bind(registryController));
router.get('/protocols/:address', registryController.getProtocol.bind(registryController));
router.get('/protocols/:address/risk', registryController.getProtocolRisk.bind(registryController));
router.get('/health', registryController.getSystemHealth.bind(registryController));

export { router as registryRoutes };
```

##### **📄 Main Routes (src/routes/index.ts):**
```typescript
import { Router } from 'express';
import { registryRoutes } from './registry.routes';

const router = Router();

// Health check at API level
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskGuardian API is running',
    timestamp: new Date().toISOString()
  });
});

// Registry routes
router.use('/registry', registryRoutes);

export { router as routes };
```

##### **📄 Update Main Server (src/index.ts) - Adicionar as rotas:**
```typescript
// ... imports anteriores ...
import { routes } from './routes';

// ... middleware anterior ...

// API routes
app.use(config.apiPrefix, routes);

// ... resto do código ...
```

##### **🔧 Comandos para Testar:**
```bash
# 1. Restart server
npm run dev

# 2. Testar endpoints
curl http://localhost:8000/health
curl http://localhost:8000/api/health
curl http://localhost:8000/api/registry/protocols
curl http://localhost:8000/api/registry/protocols/0x0227628f3F023bb0B980b67D528571c95c6DaC1c
curl http://localhost:8000/api/registry/protocols/0x0227628f3F023bb0B980b67D528571c95c6DaC1c/risk
```

##### **✅ Validação da Fase 1.7:**
Respostas esperadas:

1. **GET /api/registry/protocols** deve retornar 3 protocolos
2. **GET /api/registry/protocols/[address]** deve retornar dados do Uniswap V3
3. **GET /api/registry/protocols/[address]/risk** deve retornar métricas de risco

---

## 📊 **END OF DAY 1 - Validation Checklist**

### ✅ **Technical Success Criteria**
- [ ] ✅ Node.js + TypeScript project setup
- [ ] ✅ Express server running on port 8000
- [ ] ✅ Connected to Sepolia testnet 
- [ ] ✅ Reading data from deployed contracts
- [ ] ✅ 4+ API endpoints working
- [ ] ✅ Proper error handling and logging
- [ ] ✅ Input validation with Zod

### ✅ **Functional Success Criteria**
- [ ] ✅ Can list all registered protocols (3 expected)
- [ ] ✅ Can get individual protocol details
- [ ] ✅ Can get risk metrics for protocols
- [ ] ✅ Health checks return proper status
- [ ] ✅ All responses in consistent JSON format

### ✅ **Business Success Criteria**
- [ ] ✅ Real DeFi data (Uniswap, Aave, Compound)
- [ ] ✅ Accurate risk scores in basis points
- [ ] ✅ Performance under 2 seconds per request
- [ ] ✅ Ready for frontend integration

### 📊 **Expected API Response Examples**

**GET /api/registry/protocols**
```json
{
  "success": true,
  "data": [
    {
      "address": "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
      "name": "Uniswap V3", 
      "category": "dex",
      "riskMetrics": {
        "overallRisk": 6000,
        "volatilityScore": 6000,
        // ... etc
      }
    }
    // ... Aave, Compound
  ],
  "count": 3
}
```

---

### 🎯 **Troubleshooting Common Issues**

#### **❌ Blockchain Connection Failed**
```bash
# Test RPC directly
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}' \
  https://sepolia.drpc.org

# Should return: {"id":1,"jsonrpc":"2.0","result":"0x11155111"}
```

#### **❌ Contract Call Failed**
```bash
# Test contract with cast (if available)
cast call 0x1B7E83b953d6D4e3e6EB5be6039D079E22A375Be "owner()" --rpc-url https://sepolia.drpc.org

# Should return: 0x7BD167461C2F3ecC16AD3796c393f3b421BF365e
```

#### **❌ Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# If not running, start it
docker-compose up -d postgres
```

---

## 🎉 **Day 1 Success State**

Se tudo funcionou, você terá:
- ✅ **Working API** with real blockchain data
- ✅ **4+ endpoints** returning DeFi protocol information
- ✅ **Solid foundation** for Day 2 development
- ✅ **Professional code structure** ready to scale

**🚀 Ready for Day 2: Authentication + Portfolio Management!**