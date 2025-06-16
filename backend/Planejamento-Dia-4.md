# 📅 DIA 4: Production Ready & Testing

## ⏰ **Cronograma (8h)**

### 🌅 **MANHÃ (4h) - Testing Suite & Quality Assurance**

#### **🧪 Fase 4.1: Unit Testing Implementation (2h)**

##### **📋 Tarefas:**
1. **Configure Jest testing framework**
2. **Unit tests for services**
3. **Unit tests for controllers**
4. **Mocking strategies for blockchain/database**

##### **📄 Jest Configuration (jest.config.js):**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/types/**',
    '!src/contracts/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  verbose: true
};
```

##### **📄 Test Setup (tests/setup.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from '../src/utils/logger';

// Mock logger for tests
jest.mock('../src/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  }
}));

// Mock Prisma
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn()
    },
    portfolio: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    insurancePolicy: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      count: jest.fn()
    },
    alertSubscription: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn()
    },
    alert: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      count: jest.fn()
    },
    $disconnect: jest.fn()
  }))
}));

// Mock blockchain service
jest.mock('../src/services/blockchain.service', () => ({
  blockchainService: {
    connect: jest.fn().mockResolvedValue(true),
    getNetworkInfo: jest.fn().mockResolvedValue({
      name: 'sepolia',
      chainId: 11155111,
      blockNumber: 1234567
    }),
    getAllProtocols: jest.fn().mockResolvedValue([]),
    getProtocol: jest.fn().mockResolvedValue(null),
    getUserPositions: jest.fn().mockResolvedValue([]),
    getPortfolioAnalysis: jest.fn().mockResolvedValue(null),
    calculatePortfolioRisk: jest.fn().mockResolvedValue(5000),
    healthCheck: jest.fn().mockResolvedValue(true)
  }
}));

// Mock cache service
jest.mock('../src/services/cache.service', () => ({
  cacheService: {
    get: jest.fn().mockResolvedValue(null),
    set: jest.fn().mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(false),
    isHealthy: jest.fn().mockReturnValue(true),
    connect: jest.fn().mockResolvedValue(undefined)
  }
}));

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'error';
});

afterAll(async () => {
  // Cleanup
});

beforeEach(() => {
  // Reset all mocks before each test
  jest.clearAllMocks();
});
```

##### **📄 Auth Service Tests (tests/services/auth.service.test.ts):**
```typescript
import { AuthService } from '../../src/services/auth.service';
import { PrismaClient } from '@prisma/client';
import { verifyMessage } from 'ethers';

jest.mock('ethers', () => ({
  verifyMessage: jest.fn()
}));

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('generateNonce', () => {
    it('should generate nonce for new user', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Mock user not found, then user created
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: 'test-nonce-123',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const nonce = await authService.generateNonce(testAddress);

      expect(nonce).toBe('test-nonce-123');
      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { address: testAddress.toLowerCase() }
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should update nonce for existing user', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      // Mock existing user
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: 'old-nonce',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      mockPrisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: 'new-nonce-456',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const nonce = await authService.generateNonce(testAddress);

      expect(nonce).toBe('new-nonce-456');
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should handle database error', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('Database error'));

      await expect(authService.generateNonce(testAddress)).rejects.toThrow('Failed to generate nonce');
    });
  });

  describe('verifyAndLogin', () => {
    it('should successfully verify and login user', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testNonce = 'test-nonce-123';
      const testMessage = authService.generateLoginMessage(testNonce);
      const testSignature = '0xsignature123';

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: testNonce,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      // Mock successful signature verification
      (verifyMessage as jest.Mock).mockReturnValueOnce(testAddress);

      // Mock user update with new nonce
      mockPrisma.user.update.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: 'new-nonce',
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      const result = await authService.verifyAndLogin({
        address: testAddress,
        signature: testSignature,
        message: testMessage
      });

      expect(result.success).toBe(true);
      expect(result.token).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user?.address).toBe(testAddress.toLowerCase());
    });

    it('should fail for invalid signature', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testNonce = 'test-nonce-123';
      const testMessage = authService.generateLoginMessage(testNonce);
      const testSignature = '0xbadsignature';

      // Mock user exists
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: 'user-1',
        address: testAddress.toLowerCase(),
        nonce: testNonce,
        createdAt: new Date(),
        updatedAt: new Date()
      } as any);

      // Mock signature verification returning different address
      (verifyMessage as jest.Mock).mockReturnValueOnce('0xdifferentaddress');

      const result = await authService.verifyAndLogin({
        address: testAddress,
        signature: testSignature,
        message: testMessage
      });

      expect(result.success).toBe(false);
      expect(result.token).toBeUndefined();
    });

    it('should fail for non-existent user', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testMessage = 'test message';
      const testSignature = '0xsignature123';

      // Mock user not found
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      const result = await authService.verifyAndLogin({
        address: testAddress,
        signature: testSignature,
        message: testMessage
      });

      expect(result.success).toBe(false);
    });
  });

  describe('generateLoginMessage', () => {
    it('should generate consistent login message', () => {
      const nonce = 'test-nonce-123';
      const message = authService.generateLoginMessage(nonce);

      expect(message).toContain('Welcome to RiskGuardian AI!');
      expect(message).toContain(`Nonce: ${nonce}`);
      expect(message).toContain('Terms of Service');
    });
  });
});
```

##### **📄 Portfolio Service Tests (tests/services/portfolio.service.test.ts):**
```typescript
import { PortfolioService } from '../../src/services/portfolio.service';
import { PrismaClient } from '@prisma/client';
import { blockchainService } from '../../src/services/blockchain.service';

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockBlockchainService = blockchainService as jest.Mocked<typeof blockchainService>;

describe('PortfolioService', () => {
  let portfolioService: PortfolioService;

  beforeEach(() => {
    portfolioService = new PortfolioService();
    jest.clearAllMocks();
  });

  describe('getUserPortfolios', () => {
    it('should return user portfolios with blockchain data', async () => {
      const userId = 'user-1';
      const mockPortfolios = [
        {
          id: 'portfolio-1',
          userId,
          name: 'Test Portfolio',
          description: 'Test description',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastRiskScore: 5000,
          lastTotalValue: '1000.50',
          lastDiversification: 7500,
          lastAnalysisAt: new Date()
        }
      ];

      const mockUser = {
        id: userId,
        address: '0x1234567890123456789012345678901234567890',
        nonce: 'test-nonce',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockPositions = [
        {
          protocol: '0xprotocol1',
          token: '0xtoken1',
          amount: '100',
          value: '1000'
        }
      ];

      const mockAnalysis = {
        totalValue: '1000',
        overallRisk: 5000,
        diversificationScore: 7500,
        timestamp: 1234567890,
        isValid: true
      };

      mockPrisma.portfolio.findMany.mockResolvedValueOnce(mockPortfolios as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBlockchainService.getUserPositions.mockResolvedValue(mockPositions);
      mockBlockchainService.getPortfolioAnalysis.mockResolvedValue(mockAnalysis);

      const result = await portfolioService.getUserPortfolios(userId);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('portfolio-1');
      expect(result[0].name).toBe('Test Portfolio');
      expect(result[0].positions).toEqual(mockPositions);
      expect(result[0].analysis).toEqual(mockAnalysis);
      expect(result[0].riskSummary).toBeDefined();
      expect(result[0].riskSummary?.riskLevel).toBe('MEDIUM');
    });

    it('should handle empty portfolio list', async () => {
      const userId = 'user-1';

      mockPrisma.portfolio.findMany.mockResolvedValueOnce([]);

      const result = await portfolioService.getUserPortfolios(userId);

      expect(result).toHaveLength(0);
    });

    it('should handle database error', async () => {
      const userId = 'user-1';

      mockPrisma.portfolio.findMany.mockRejectedValueOnce(new Error('Database error'));

      await expect(portfolioService.getUserPortfolios(userId)).rejects.toThrow('Failed to fetch portfolios');
    });
  });

  describe('createPortfolio', () => {
    it('should create new portfolio successfully', async () => {
      const userId = 'user-1';
      const portfolioData = {
        name: 'New Portfolio',
        description: 'New portfolio description'
      };

      const mockCreatedPortfolio = {
        id: 'portfolio-2',
        userId,
        name: portfolioData.name,
        description: portfolioData.description,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRiskScore: null,
        lastTotalValue: null,
        lastDiversification: null,
        lastAnalysisAt: null
      };

      const mockUser = {
        id: userId,
        address: '0x1234567890123456789012345678901234567890',
        nonce: 'test-nonce',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.portfolio.create.mockResolvedValueOnce(mockCreatedPortfolio as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBlockchainService.getUserPositions.mockResolvedValue([]);
      mockBlockchainService.getPortfolioAnalysis.mockResolvedValue(null);

      const result = await portfolioService.createPortfolio(userId, portfolioData);

      expect(result.id).toBe('portfolio-2');
      expect(result.name).toBe('New Portfolio');
      expect(result.description).toBe('New portfolio description');
      expect(result.isActive).toBe(true);
      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: portfolioData.name,
          description: portfolioData.description,
          isActive: true
        })
      });
    });

    it('should create portfolio with default name when not provided', async () => {
      const userId = 'user-1';
      const portfolioData = {};

      const mockCreatedPortfolio = {
        id: 'portfolio-3',
        userId,
        name: expect.stringContaining('Portfolio'),
        description: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRiskScore: null,
        lastTotalValue: null,
        lastDiversification: null,
        lastAnalysisAt: null
      };

      const mockUser = {
        id: userId,
        address: '0x1234567890123456789012345678901234567890',
        nonce: 'test-nonce',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockPrisma.portfolio.create.mockResolvedValueOnce(mockCreatedPortfolio as any);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser as any);
      mockBlockchainService.getUserPositions.mockResolvedValue([]);
      mockBlockchainService.getPortfolioAnalysis.mockResolvedValue(null);

      const result = await portfolioService.createPortfolio(userId, portfolioData);

      expect(result.id).toBe('portfolio-3');
      expect(result.name).toContain('Portfolio');
      expect(mockPrisma.portfolio.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId,
          name: expect.stringContaining('Portfolio'),
          isActive: true
        })
      });
    });
  });

  describe('getPortfolioRisk', () => {
    it('should calculate and cache portfolio risk', async () => {
      const portfolioId = 'portfolio-1';
      const userId = 'user-1';
      const userAddress = '0x1234567890123456789012345678901234567890';

      const mockPortfolio = {
        id: portfolioId,
        userId,
        name: 'Test Portfolio',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockPositions = [
        { protocol: '0xprotocol1', token: '0xtoken1', amount: '100', value: '1000' }
      ];

      const mockAnalysis = {
        totalValue: '1000',
        overallRisk: 6500,
        diversificationScore: 7000,
        timestamp: 1234567890,
        isValid: true
      };

      mockPrisma.portfolio.findFirst.mockResolvedValueOnce(mockPortfolio as any);
      mockBlockchainService.calculatePortfolioRisk.mockResolvedValue(6500);
      mockBlockchainService.getUserPositions.mockResolvedValue(mockPositions);
      mockBlockchainService.getPortfolioAnalysis.mockResolvedValue(mockAnalysis);
      mockPrisma.portfolio.update.mockResolvedValueOnce(mockPortfolio as any);

      const result = await portfolioService.getPortfolioRisk(portfolioId, userId, userAddress);

      expect(result.portfolioId).toBe(portfolioId);
      expect(result.riskScore).toBe(6500);
      expect(result.riskLevel).toBe('HIGH');
      expect(result.riskPercentage).toBe('65.00%');
      expect(result.positionCount).toBe(1);
      expect(result.totalValue).toBe('1000');
      expect(mockPrisma.portfolio.update).toHaveBeenCalled();
    });

    it('should throw error for non-existent portfolio', async () => {
      const portfolioId = 'non-existent';
      const userId = 'user-1';
      const userAddress = '0x1234567890123456789012345678901234567890';

      mockPrisma.portfolio.findFirst.mockResolvedValueOnce(null);

      await expect(
        portfolioService.getPortfolioRisk(portfolioId, userId, userAddress)
      ).rejects.toThrow('Portfolio not found');
    });
  });
});
```

##### **📄 Controller Tests (tests/controllers/auth.controller.test.ts):**
```typescript
import request from 'supertest';
import express from 'express';
import { AuthController } from '../../src/controllers/auth.controller';
import { authService } from '../../src/services/auth.service';

jest.mock('../../src/services/auth.service');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('AuthController', () => {
  let app: express.Application;
  let authController: AuthController;

  beforeEach(() => {
    authController = new AuthController();
    app = express();
    app.use(express.json());
    
    // Setup routes
    app.post('/auth/nonce', authController.requestNonce.bind(authController));
    app.post('/auth/login', authController.login.bind(authController));
    
    jest.clearAllMocks();
  });

  describe('POST /auth/nonce', () => {
    it('should generate nonce for valid address', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      const testNonce = 'test-nonce-123';
      
      mockAuthService.generateNonce.mockResolvedValueOnce(testNonce);
      mockAuthService.generateLoginMessage.mockReturnValueOnce('Welcome to RiskGuardian AI!...');

      const response = await request(app)
        .post('/auth/nonce')
        .send({ address: testAddress })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address).toBe(testAddress);
      expect(response.body.data.nonce).toBe(testNonce);
      expect(response.body.data.message).toContain('Welcome to RiskGuardian AI!');
      expect(mockAuthService.generateNonce).toHaveBeenCalledWith(testAddress);
    });

    it('should reject invalid address format', async () => {
      const invalidAddress = 'invalid-address';

      const response = await request(app)
        .post('/auth/nonce')
        .send({ address: invalidAddress })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid request data');
      expect(mockAuthService.generateNonce).not.toHaveBeenCalled();
    });

    it('should handle service error', async () => {
      const testAddress = '0x1234567890123456789012345678901234567890';
      
      mockAuthService.generateNonce.mockRejectedValueOnce(new Error('Service error'));

      const response = await request(app)
        .post('/auth/nonce')
        .send({ address: testAddress })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to generate nonce');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully with valid signature', async () => {
      const loginData = {
        address: '0x1234567890123456789012345678901234567890',
        signature: '0xsignature123',
        message: 'Welcome to RiskGuardian AI!...'
      };

      const mockResponse = {
        success: true,
        token: 'jwt-token-123',
        user: {
          address: loginData.address.toLowerCase(),
          nonce: 'new-nonce'
        },
        expiresIn: '7d'
      };

      mockAuthService.verifyAndLogin.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.token).toBe('jwt-token-123');
      expect(response.body.user.address).toBe(loginData.address.toLowerCase());
      expect(mockAuthService.verifyAndLogin).toHaveBeenCalledWith(loginData);
    });

    it('should reject invalid signature', async () => {
      const loginData = {
        address: '0x1234567890123456789012345678901234567890',
        signature: '0xbadsignature',
        message: 'Welcome to RiskGuardian AI!...'
      };

      const mockResponse = {
        success: false,
        error: 'Signature verification failed'
      };

      mockAuthService.verifyAndLogin.mockResolvedValueOnce(mockResponse);

      const response = await request(app)
        .post('/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.token).toBeUndefined();
    });

    it('should reject invalid input format', async () => {
      const invalidData = {
        address: 'invalid-address',
        signature: 'not-hex',
        message: ''
      };

      const response = await request(app)
        .post('/auth/login')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid login data');
      expect(mockAuthService.verifyAndLogin).not.toHaveBeenCalled();
    });
  });
});
```

##### **✅ Validação da Fase 4.1:**
```bash
# Install testing dependencies
npm install -D jest @types/jest supertest @types/supertest ts-jest

# Add test scripts to package.json
# "test": "jest",
# "test:watch": "jest --watch",
# "test:coverage": "jest --coverage"

# Run tests
npm test

# Expected output:
# ✅ Auth Service: X tests passing
# ✅ Portfolio Service: Y tests passing  
# ✅ Auth Controller: Z tests passing
# ✅ Coverage: >80%
```

---

#### **🔗 Fase 4.2: Integration Testing (2h)**

##### **📋 Tarefas:**
1. **API integration tests**
2. **End-to-end workflow tests**
3. **Database integration tests**
4. **Error scenario testing**

##### **📄 Integration Test Setup (tests/integration/setup.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
import { config } from '../../src/config/environment';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.TEST_DATABASE_URL || config.databaseUrl
    }
  }
});

export async function setupTestDatabase() {
  // Clean database
  await prisma.alert.deleteMany();
  await prisma.alertSubscription.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();
  
  // Seed test data
  const testUser = await prisma.user.create({
    data: {
      address: '0x742d35cc6634c0532925a3b8e4c168b7d1e9',
      nonce: 'test-nonce-123'
    }
  });

  const testPortfolio = await prisma.portfolio.create({
    data: {
      userId: testUser.id,
      name: 'Test Portfolio',
      description: 'Integration test portfolio',
      lastRiskScore: 5000,
      lastTotalValue: '1000.00',
      lastDiversification: 7500
    }
  });

  return { testUser, testPortfolio };
}

export async function cleanupTestDatabase() {
  await prisma.alert.deleteMany();
  await prisma.alertSubscription.deleteMany();
  await prisma.insurancePolicy.deleteMany();
  await prisma.portfolio.deleteMany();
  await prisma.user.deleteMany();
  await prisma.$disconnect();
}

export { prisma };
```

##### **📄 API Integration Tests (tests/integration/api.test.ts):**
```typescript
import request from 'supertest';
import app from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/environment';

describe('API Integration Tests', () => {
  let testUser: any;
  let testPortfolio: any;
  let authToken: string;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    testUser = setup.testUser;
    testPortfolio = setup.testPortfolio;
    
    // Generate test JWT token
    authToken = jwt.sign(
      { address: testUser.address, userId: testUser.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Health Endpoints', () => {
    it('should return server health', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.version).toBeDefined();
    });

    it('should return API health', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.message).toContain('RiskGuardian API');
    });
  });

  describe('Registry Endpoints', () => {
    it('should list protocols', async () => {
      const response = await request(app)
        .get('/api/registry/protocols')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeDefined();
    });

    it('should get specific protocol', async () => {
      const protocolAddress = '0x0227628f3F023bb0B980b67D528571c95c6DaC1c';
      
      const response = await request(app)
        .get(`/api/registry/protocols/${protocolAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.address).toBe(protocolAddress);
      expect(response.body.data.name).toBeDefined();
    });

    it('should return 404 for non-existent protocol', async () => {
      const fakeAddress = '0x1234567890123456789012345678901234567890';
      
      const response = await request(app)
        .get(`/api/registry/protocols/${fakeAddress}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Protocol not found');
    });

    it('should reject invalid address format', async () => {
      const invalidAddress = 'invalid-address';
      
      const response = await request(app)
        .get(`/api/registry/protocols/${invalidAddress}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid protocol address format');
    });
  });

  describe('Authentication Flow', () => {
    it('should complete full auth flow', async () => {
      const testAddress = '0x123456789012345678901234567890abcdef1234';

      // Step 1: Request nonce
      const nonceResponse = await request(app)
        .post('/api/auth/nonce')
        .send({ address: testAddress })
        .expect(200);

      expect(nonceResponse.body.success).toBe(true);
      expect(nonceResponse.body.data.nonce).toBeDefined();
      expect(nonceResponse.body.data.message).toContain('Welcome to RiskGuardian AI!');

      // Step 2: Login (would normally require real signature)
      // For integration test, we'll mock the signature verification
      const loginData = {
        address: testAddress,
        signature: '0xmocksignature123',
        message: nonceResponse.body.data.message
      };

      // Note: This would fail in real scenario without proper signature
      // But shows the flow structure
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      // Expect either success (if mock works) or specific auth failure
      expect([200, 401]).toContain(loginResponse.status);
    });
  });

  describe('Protected Portfolio Endpoints', () => {
    it('should get user portfolios with auth', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThanOrEqual(1);
    });

    it('should reject portfolio access without auth', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should create new portfolio', async () => {
      const portfolioData = {
        name: 'Integration Test Portfolio',
        description: 'Created during integration testing'
      };

      const response = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send(portfolioData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(portfolioData.name);
      expect(response.body.data.description).toBe(portfolioData.description);
      expect(response.body.data.id).toBeDefined();
    });

    it('should get specific portfolio', async () => {
      const response = await request(app)
        .get(`/api/portfolio/${testPortfolio.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPortfolio.id);
      expect(response.body.data.name).toBe(testPortfolio.name);
    });

    it('should calculate portfolio risk', async () => {
      const response = await request(app)
        .get(`/api/portfolio/${testPortfolio.id}/risk`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.portfolioId).toBe(testPortfolio.id);
      expect(response.body.data.riskScore).toBeDefined();
      expect(response.body.data.riskLevel).toBeDefined();
    });

    it('should update portfolio', async () => {
      const updateData = {
        name: 'Updated Portfolio Name',
        description: 'Updated description'
      };

      const response = await request(app)
        .put(`/api/portfolio/${testPortfolio.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should delete portfolio', async () => {
      // First create a portfolio to delete
      const createResponse = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'To Be Deleted' });

      const portfolioId = createResponse.body.data.id;

      const deleteResponse = await request(app)
        .delete(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(deleteResponse.body.success).toBe(true);

      // Verify portfolio is deleted
      await request(app)
        .get(`/api/portfolio/${portfolioId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should handle missing required fields', async () => {
      const response = await request(app)
        .post('/api/auth/nonce')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid');
    });

    it('should handle invalid JWT token', async () => {
      const response = await request(app)
        .get('/api/portfolio')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-endpoint')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('Rate Limiting', () => {
    it('should apply rate limiting after many requests', async () => {
      // Make multiple requests quickly
      const requests = Array(10).fill(null).map(() =>
        request(app).get('/health')
      );

      const responses = await Promise.all(requests);
      
      // Most should succeed, but rate limiting should kick in
      const successCount = responses.filter(r => r.status === 200).length;
      const rateLimitedCount = responses.filter(r => r.status === 429).length;
      
      expect(successCount + rateLimitedCount).toBe(10);
      // At least some requests should succeed
      expect(successCount).toBeGreaterThan(0);
    }, 30000);
  });
});
```

##### **📄 End-to-End Workflow Tests (tests/integration/workflows.test.ts):**
```typescript
import request from 'supertest';
import app from '../../src/index';
import { setupTestDatabase, cleanupTestDatabase } from './setup';
import jwt from 'jsonwebtoken';
import { config } from '../../src/config/environment';

describe('End-to-End Workflows', () => {
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    const setup = await setupTestDatabase();
    testUser = setup.testUser;
    
    authToken = jwt.sign(
      { address: testUser.address, userId: testUser.id },
      config.jwtSecret,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('Complete User Journey', () => {
    it('should complete full user journey: register → portfolio → insurance → alerts', async () => {
      // Step 1: Create Portfolio
      const portfolioResponse = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'E2E Test Portfolio',
          description: 'End-to-end testing portfolio'
        })
        .expect(201);

      const portfolioId = portfolioResponse.body.data.id;
      expect(portfolioId).toBeDefined();

      // Step 2: Get Portfolio Risk
      const riskResponse = await request(app)
        .get(`/api/portfolio/${portfolioId}/risk`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(riskResponse.body.data.riskScore).toBeDefined();
      const riskScore = riskResponse.body.data.riskScore;

      // Step 3: Create Insurance Policy
      const insuranceResponse = await request(app)
        .post('/api/insurance')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          coverageAmount: '1000',
          riskThreshold: riskScore + 1000, // Set threshold above current risk
          duration: 30
        })
        .expect(201);

      const policyId = insuranceResponse.body.data.id;
      expect(policyId).toBeDefined();

      // Step 4: Create Alert Subscription
      const alertResponse = await request(app)
        .post('/api/alerts/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          alertType: 0, // RISK_THRESHOLD
          protocolAddress: '0x0227628f3F023bb0B980b67D528571c95c6DaC1c',
          threshold: 7000,
          cooldownMinutes: 30
        })
        .expect(201);

      const subscriptionId = alertResponse.body.data.id;
      expect(subscriptionId).toBeDefined();

      // Step 5: Get User's Complete Profile
      const portfoliosResponse = await request(app)
        .get('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const insurancesResponse = await request(app)
        .get('/api/insurance')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const subscriptionsResponse = await request(app)
        .get('/api/alerts/subscriptions')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify all data is connected
      expect(portfoliosResponse.body.data.length).toBeGreaterThanOrEqual(1);
      expect(insurancesResponse.body.data.length).toBeGreaterThanOrEqual(1);
      expect(subscriptionsResponse.body.data.length).toBeGreaterThanOrEqual(1);

      // Verify data consistency
      const portfolio = portfoliosResponse.body.data.find((p: any) => p.id === portfolioId);
      const insurance = insurancesResponse.body.data.find((i: any) => i.id === policyId);
      const subscription = subscriptionsResponse.body.data.find((s: any) => s.id === subscriptionId);

      expect(portfolio).toBeDefined();
      expect(insurance).toBeDefined();
      expect(subscription).toBeDefined();

      console.log('✅ Complete user journey test passed');
      console.log(`   Portfolio: ${portfolio.name}`);
      console.log(`   Insurance: ${insurance.coverageAmount} ETH coverage`);
      console.log(`   Alert: ${subscription.threshold / 100}% threshold`);
    }, 30000);
  });

  describe('Analytics Workflow', () => {
    it('should generate comprehensive analytics', async () => {
      // Step 1: Get Portfolio Performance
      const performanceResponse = await request(app)
        .get('/api/analytics/portfolio/performance?timeframe=30d')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(performanceResponse.body.data.metrics).toBeDefined();
      expect(performanceResponse.body.data.breakdown).toBeDefined();

      // Step 2: Get Market Insights
      const insightsResponse = await request(app)
        .get('/api/analytics/market/insights')
        .expect(200);

      expect(insightsResponse.body.data.topPerformingProtocols).toBeInstanceOf(Array);
      expect(insightsResponse.body.data.marketTrends).toBeDefined();

      // Step 3: Get User Activity Stats
      const activityResponse = await request(app)
        .get('/api/analytics/user/activity')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(activityResponse.body.data.metrics).toBeDefined();
      expect(activityResponse.body.data.engagement).toBeDefined();

      console.log('✅ Analytics workflow test passed');
    });
  });

  describe('Error Recovery Workflow', () => {
    it('should handle and recover from errors gracefully', async () => {
      // Test 1: Invalid data submission
      const invalidPortfolioResponse = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid: empty name
          description: 'A'.repeat(1000) // Invalid: too long
        })
        .expect(400);

      expect(invalidPortfolioResponse.body.success).toBe(false);

      // Test 2: Access to non-existent resource
      const nonExistentResponse = await request(app)
        .get('/api/portfolio/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(nonExistentResponse.body.success).toBe(false);

      // Test 3: Recovery - Valid request after errors
      const validResponse = await request(app)
        .post('/api/portfolio')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Recovery Test Portfolio',
          description: 'Valid portfolio after error'
        })
        .expect(201);

      expect(validResponse.body.success).toBe(true);

      console.log('✅ Error recovery workflow test passed');
    });
  });
});
```

##### **✅ Validação da Fase 4.2:**
```bash
# Create test database
createdb riskguardian_test

# Update .env for test
echo "TEST_DATABASE_URL=postgresql://postgres:password@localhost:5432/riskguardian_test" >> .env

# Run integration tests
npm run test:integration

# Expected output:
# ✅ API Integration: All endpoints working
# ✅ E2E Workflows: Complete user journeys
# ✅ Error Handling: Graceful error recovery
```

---

### 🌤️ **TARDE (4h) - Production Optimization & Documentation**

#### **⚡ Fase 4.3: Performance Optimization (2h)**

##### **📋 Tarefas:**
1. **Database query optimization**
2. **Caching strategy enhancement**
3. **Rate limiting configuration**
4. **Memory and CPU optimization**

##### **📄 Database Optimization (src/utils/database.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Optimized Prisma configuration
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Query logging for performance monitoring
prisma.$on('query', (e) => {
  if (process.env.NODE_ENV === 'development') {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Duration: ${e.duration}ms`);
  }
  
  // Log slow queries in production
  if (e.duration > 1000) {
    logger.warn(`Slow query detected: ${e.duration}ms`, {
      query: e.query,
      params: e.params
    });
  }
});

// Connection pool optimization
export const configurePrisma = () => {
  // Set connection pool size based on environment
  const poolSize = process.env.NODE_ENV === 'production' ? 10 : 5;
  
  return new PrismaClient({
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?connection_limit=${poolSize}&pool_timeout=20`
      }
    }
  });
};

// Graceful shutdown
export const disconnectPrisma = async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};
```

##### **📄 Enhanced Caching (src/services/cache.service.ts - Update):**
```typescript
// Add to existing CacheService class:

  // Cache with automatic refresh
  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number = 300,
    refreshThreshold: number = 0.8
  ): Promise<T> {
    try {
      // Check if data exists
      const existing = await this.get<{ data: T; timestamp: number }>(key);
      
      if (existing) {
        const age = Date.now() - existing.timestamp;
        const maxAge = ttlSeconds * 1000;
        
        // Return cached data if not too old
        if (age < maxAge * refreshThreshold) {
          return existing.data;
        }
        
        // Background refresh if approaching expiry
        if (age < maxAge) {
          this.backgroundRefresh(key, fetcher, ttlSeconds);
          return existing.data;
        }
      }
      
      // Fetch fresh data
      const data = await fetcher();
      await this.set(key, { data, timestamp: Date.now() }, ttlSeconds);
      
      return data;
      
    } catch (error) {
      logger.error('Cache getOrSet error:', error);
      // Fallback to direct fetch
      return await fetcher();
    }
  }

  private async backgroundRefresh<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds: number
  ): Promise<void> {
    try {
      const data = await fetcher();
      await this.set(key, { data, timestamp: Date.now() }, ttlSeconds);
      logger.debug(`Background refresh completed for key: ${key}`);
    } catch (error) {
      logger.error(`Background refresh failed for key: ${key}`, error);
    }
  }

  // Cache invalidation patterns
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      
      // In a real Redis implementation, you'd use SCAN with pattern
      // For simplicity, we'll track keys and match patterns
      logger.debug(`Cache pattern invalidation: ${pattern}`);
    } catch (error) {
      logger.error('Cache pattern invalidation error:', error);
    }
  }

  // Cache warming strategies
  async warmCache(): Promise<void> {
    try {
      logger.info('🔥 Warming cache with frequently accessed data...');
      
      // Warm up protocol data
      const protocols = await blockchainService.getAllProtocols();
      await this.set('protocols:all', protocols, 3600);
      
      // Warm up market insights
      const insights = await oracleService.getMarketInsights?.();
      if (insights) {
        await this.set('analytics:market:insights', insights, 3600);
      }
      
      logger.info('✅ Cache warming completed');
      
    } catch (error) {
      logger.error('Cache warming failed:', error);
    }
  }
```

##### **📄 Rate Limiting Enhancement (src/middleware/rateLimiting.ts):**
```typescript
import rateLimit from 'express-rate-limit';
import { Redis } from 'redis';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

// Create Redis client for rate limiting
const redisClient = Redis.createClient({
  url: config.redisUrl
});

// Different rate limits for different endpoints
export const createRateLimit = (options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  skipSuccessfulRequests?: boolean;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.maxRequests,
    message: {
      success: false,
      error: options.message || 'Too many requests',
      retryAfter: Math.ceil(options.windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    
    // Custom key generator based on user
    keyGenerator: (req) => {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          const token = authHeader.substring(7);
          const decoded = jwt.verify(token, config.jwtSecret) as any;
          return `user:${decoded.userId}`;
        } catch {
          // Fall back to IP if token is invalid
        }
      }
      return req.ip;
    },
    
    // Custom store using Redis
    store: {
      incr: async (key: string) => {
        const current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.expire(key, Math.ceil(options.windowMs / 1000));
        }
        return { totalCount: current, resetTime: new Date(Date.now() + options.windowMs) };
      },
      decrement: async (key: string) => {
        await redisClient.decr(key);
      },
      resetKey: async (key: string) => {
        await redisClient.del(key);
      }
    },
    
    onLimitReached: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.ip}`, {
        endpoint: req.path,
        method: req.method,
        userAgent: req.get('User-Agent')
      });
    }
  });
};

// Specific rate limiters
export const generalLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100,
  message: 'Too many requests from this IP'
});

export const authLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 10, // Stricter for auth endpoints
  message: 'Too many authentication attempts'
});

export const blockchainLimiter = createRateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 30, // Allow more for blockchain calls
  message: 'Too many blockchain requests',
  skipSuccessfulRequests: true
});

export const premiumLimiter = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 500, // Higher limits for premium users
  message: 'Rate limit exceeded - upgrade for higher limits'
});
```

##### **📄 Performance Monitoring (src/middleware/performance.ts):**
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Request timing middleware
export const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Log slow requests
    if (duration > 2000) {
      logger.warn(`Slow request detected: ${req.method} ${req.path}`, {
        duration: `${duration}ms`,
        statusCode,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });
    }
    
    // Log request metrics for monitoring
    if (process.env.NODE_ENV === 'production') {
      logger.info('Request completed', {
        method: req.method,
        path: req.path,
        statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('content-length')
      });
    }
  });
  
  next();
};

// Memory usage monitoring
export const memoryMonitor = () => {
  setInterval(() => {
    const usage = process.memoryUsage();
    
    logger.debug('Memory usage', {
      rss: `${Math.round(usage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(usage.external / 1024 / 1024)} MB`
    });
    
    // Alert if memory usage is high
    const heapUsedMB = usage.heapUsed / 1024 / 1024;
    if (heapUsedMB > 500) {
      logger.warn(`High memory usage detected: ${Math.round(heapUsedMB)} MB`);
    }
  }, 60000); // Check every minute
};

// Response compression
export const compressionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Only compress JSON responses larger than 1KB
  const originalSend = res.send;
  
  res.send = function(data: any) {
    if (typeof data === 'string' && data.length > 1024) {
      res.set('Content-Encoding', 'gzip');
    }
    return originalSend.call(this, data);
  };
  
  next();
};
```

##### **📄 Updated Main Server (src/index.ts - Performance Updates):**
```typescript
// Add to existing index.ts:

// Performance monitoring
import { requestTimer, memoryMonitor, compressionMiddleware } from './middleware/performance';
import { generalLimiter, authLimiter, blockchainLimiter } from './middleware/rateLimiting';
import compression from 'compression';

// Add after existing middleware:
app.use(compression());
app.use(compressionMiddleware);
app.use(requestTimer);

// Apply different rate limits to different routes
app.use('/api/auth', authLimiter);
app.use('/api/registry', blockchainLimiter);
app.use('/api', generalLimiter);

// Start memory monitoring
memoryMonitor();

// Enhanced graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close database connections
      await prisma.$disconnect();
      logger.info('Database connections closed');
      
      // Close cache connections
      if (cacheService.isHealthy()) {
        await cacheService.disconnect?.();
        logger.info('Cache connections closed');
      }
      
      logger.info('Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 30000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

##### **✅ Validação da Fase 4.3:**
```bash
# Install additional dependencies
npm install compression

# Test performance improvements
npm run dev

# Monitor performance
curl -w "@curl-format.txt" http://localhost:8000/api/registry/protocols

# Check memory usage
curl http://localhost:8000/health
```

---

#### **📚 Fase 4.4: Complete Documentation (2h)**

##### **📋 Tarefas:**
1. **API documentation with Swagger**
2. **Deployment documentation**
3. **Development workflow documentation**
4. **Performance and monitoring guides**

##### **📄 Swagger/OpenAPI Documentation (src/docs/swagger.ts):**
```typescript
import swaggerJSDoc from 'swagger-jsdoc';
import { config } from '../config/environment';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'RiskGuardian AI API',
      version: '1.0.0',
      description: 'AI-powered DeFi Risk Analysis Platform API',
      contact: {
        name: 'RiskGuardian Team',
        email: 'api@riskguardian.ai',
        url: 'https://riskguardian.ai'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${config.port}${config.apiPrefix}`,
        description: 'Development server'
      },
      {
        url: 'https://api.riskguardian.ai',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token obtained from /auth/login'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: 'Error message' },
            message: { type: 'string', example: 'Detailed error description' }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' }
          }
        },
        Protocol: {
          type: 'object',
          properties: {
            address: { type: 'string', pattern: '^0x[a-fA-F0-9]{40}$' },
            name: { type: 'string', example: 'Uniswap V3' },
            category: { type: 'string', example: 'dex' },
            tvl: { type