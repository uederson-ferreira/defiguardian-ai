# 📅 DIA 2: Authentication & Portfolio Management

## ⏰ **Cronograma (8h)**

### 🌅 **MANHÃ (4h) - Web3 Authentication**

#### **🔐 Fase 2.1: Web3 Auth Implementation (2h)**

##### **📋 Tarefas:**
1. **Implementar autenticação com MetaMask**
2. **Criar sistema de nonce para segurança**
3. **Implementar JWT tokens**
4. **Middleware de autenticação**

##### **📄 Auth Types (src/types/auth.ts):**
```typescript
import { Request } from 'express';

export interface User {
  id: string;
  address: string;
  nonce: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface LoginRequest {
  address: string;
  signature: string;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    address: string;
    nonce: string;
  };
  expiresIn?: string;
}
```

##### **📄 Auth Service (src/services/auth.service.ts):**
```typescript
import jwt from 'jsonwebtoken';
import { verifyMessage } from 'ethers';
import { PrismaClient } from '@prisma/client';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { User, LoginRequest, AuthResponse } from '../types/auth';

const prisma = new PrismaClient();

export class AuthService {

  /**
   * Generate a nonce for user authentication
   */
  async generateNonce(address: string): Promise<string> {
    try {
      logger.info(`🔑 Generating nonce for address: ${address}`);
      
      // Find or create user
      let user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });

      const newNonce = this.generateRandomNonce();

      if (user) {
        // Update existing user's nonce
        user = await prisma.user.update({
          where: { address: address.toLowerCase() },
          data: { nonce: newNonce }
        });
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            address: address.toLowerCase(),
            nonce: newNonce
          }
        });
      }

      logger.info(`✅ Nonce generated for user: ${address}`);
      return user.nonce;
      
    } catch (error) {
      logger.error('Error generating nonce:', error);
      throw new Error('Failed to generate nonce');
    }
  }

  /**
   * Verify signature and login user
   */
  async verifyAndLogin(loginData: LoginRequest): Promise<AuthResponse> {
    try {
      const { address, signature, message } = loginData;
      
      logger.info(`🔐 Attempting login for address: ${address}`);

      // Get user and verify nonce exists
      const user = await prisma.user.findUnique({
        where: { address: address.toLowerCase() }
      });

      if (!user) {
        throw new Error('User not found. Please request a nonce first.');
      }

      // Verify the message contains the nonce
      const expectedMessage = this.generateLoginMessage(user.nonce);
      if (message !== expectedMessage) {
        throw new Error('Invalid message format or nonce mismatch');
      }

      // Verify signature
      const recoveredAddress = verifyMessage(message, signature);
      
      if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
        throw new Error('Signature verification failed');
      }

      // Generate new nonce for next login (prevent replay attacks)
      const newNonce = this.generateRandomNonce();
      await prisma.user.update({
        where: { address: address.toLowerCase() },
        data: { nonce: newNonce }
      });

      // Generate JWT token
      const token = this.generateJWT(user);

      logger.info(`✅ Login successful for address: ${address}`);

      return {
        success: true,
        token,
        user: {
          address: user.address,
          nonce: newNonce // Return new nonce for next login
        },
        expiresIn: config.jwtExpiresIn
      };

    } catch (error) {
      logger.error('Login verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed'
      };
    }
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      
      const user = await prisma.user.findUnique({
        where: { address: decoded.address }
      });

      return user;
      
    } catch (error) {
      logger.error('Token verification failed:', error);
      return null;
    }
  }

  /**
   * Generate login message
   */
  generateLoginMessage(nonce: string): string {
    return `Welcome to RiskGuardian AI!

Click to sign in and accept the RiskGuardian Terms of Service.

This request will not trigger a blockchain transaction or cost any gas fees.

Nonce: ${nonce}`;
  }

  /**
   * Generate random nonce
   */
  private generateRandomNonce(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  /**
   * Generate JWT token
   */
  private generateJWT(user: User): string {
    return jwt.sign(
      { 
        address: user.address,
        userId: user.id 
      },
      config.jwtSecret,
      { 
        expiresIn: config.jwtExpiresIn,
        issuer: 'riskguardian-api',
        subject: user.address
      }
    );
  }
}

export const authService = new AuthService();
```

##### **📄 Auth Middleware (src/middleware/auth.middleware.ts):**
```typescript
import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

export async function authMiddleware(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access token required',
        message: 'Please provide a valid Bearer token'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const user = await authService.verifyToken(token);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
        message: 'Please login again'
      });
    }

    req.user = user;
    next();
    
  } catch (error) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Invalid token'
    });
  }
}

// Optional middleware - allows access but adds user if token is valid
export async function optionalAuthMiddleware(
  req: AuthenticatedRequest, 
  res: Response, 
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const user = await authService.verifyToken(token);
      if (user) {
        req.user = user;
      }
    }
    
    next();
    
  } catch (error) {
    // Don't fail - just continue without user
    logger.warn('Optional auth failed:', error);
    next();
  }
}
```

##### **📄 Auth Controller (src/controllers/auth.controller.ts):**
```typescript
import { Request, Response } from 'express';
import { z } from 'zod';
import { authService } from '../services/auth.service';
import { logger } from '../utils/logger';

// Validation schemas
const nonceRequestSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address')
});

const loginSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature format'),
  message: z.string().min(1, 'Message is required')
});

export class AuthController {

  async requestNonce(req: Request, res: Response) {
    try {
      const validation = nonceRequestSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request data',
          details: validation.error.errors
        });
      }

      const { address } = validation.data;
      
      logger.info(`🔑 Nonce requested for: ${address}`);
      
      const nonce = await authService.generateNonce(address);
      const message = authService.generateLoginMessage(nonce);

      res.json({
        success: true,
        data: {
          address,
          nonce,
          message
        }
      });

      logger.info(`✅ Nonce provided for: ${address}`);
      
    } catch (error) {
      logger.error('Error in requestNonce:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to generate nonce',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const validation = loginSchema.safeParse(req.body);
      
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid login data',
          details: validation.error.errors
        });
      }

      const loginData = validation.data;
      
      logger.info(`🔐 Login attempt for: ${loginData.address}`);
      
      const result = await authService.verifyAndLogin(loginData);

      const statusCode = result.success ? 200 : 401;
      res.status(statusCode).json(result);

      if (result.success) {
        logger.info(`✅ Login successful for: ${loginData.address}`);
      } else {
        logger.warn(`❌ Login failed for: ${loginData.address}`);
      }
      
    } catch (error) {
      logger.error('Error in login:', error);
      res.status(500).json({
        success: false,
        error: 'Login process failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getProfile(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      res.json({
        success: true,
        data: {
          address: req.user.address,
          createdAt: req.user.createdAt,
          updatedAt: req.user.updatedAt
        }
      });
      
    } catch (error) {
      logger.error('Error in getProfile:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get profile'
      });
    }
  }

  async logout(req: AuthenticatedRequest, res: Response) {
    try {
      // For stateless JWT, logout is handled client-side
      // But we can regenerate nonce to invalidate future use
      if (req.user) {
        await authService.generateNonce(req.user.address);
        logger.info(`🔓 User logged out: ${req.user.address}`);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
      
    } catch (error) {
      logger.error('Error in logout:', error);
      res.status(500).json({
        success: false,
        error: 'Logout failed'
      });
    }
  }
}
```

##### **📄 Auth Routes (src/routes/auth.routes.ts):**
```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/nonce', authController.requestNonce.bind(authController));
router.post('/login', authController.login.bind(authController));

// Protected routes
router.get('/profile', authMiddleware, authController.getProfile.bind(authController));
router.post('/logout', authMiddleware, authController.logout.bind(authController));

export { router as authRoutes };
```

##### **✅ Validação da Fase 2.1:**
```bash
# 1. Atualizar routes principais (src/routes/index.ts)
# Adicionar: router.use('/auth', authRoutes);

# 2. Restart server
npm run dev

# 3. Testar fluxo de autenticação
# Request nonce
curl -X POST http://localhost:8000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b8e4C168b7d1e9"}'

# Expected response:
# {
#   "success": true,
#   "data": {
#     "address": "0x742d35...",
#     "nonce": "abc123...",
#     "message": "Welcome to RiskGuardian AI!..."
#   }
# }
```

---

#### **📊 Fase 2.2: Database Integration (1h)**

##### **📋 Tarefas:**
1. **Executar migrações do Prisma**
2. **Criar seed data para testes**
3. **Testar operações de database**
4. **Configurar Redis para cache**

##### **🔧 Database Setup:**
```bash
# 1. Executar migração se ainda não foi feita
npx prisma migrate dev --name add_auth_tables

# 2. Gerar cliente atualizado
npx prisma generate

# 3. Verificar conexão
npx prisma db seed
```

##### **📄 Seed File (prisma/seed.ts):**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test user
  const testUser = await prisma.user.upsert({
    where: { address: '0x742d35cc6634c0532925a3b8e4c168b7d1e9' },
    update: {},
    create: {
      address: '0x742d35cc6634c0532925a3b8e4c168b7d1e9',
      nonce: 'test-nonce-123'
    }
  });

  console.log('✅ Test user created:', testUser.address);

  // Create test portfolio
  const testPortfolio = await prisma.portfolio.upsert({
    where: { id: 'test-portfolio-1' },
    update: {},
    create: {
      id: 'test-portfolio-1',
      userId: testUser.id,
      name: 'Test DeFi Portfolio',
      description: 'Sample portfolio for testing',
      lastRiskScore: 6500,
      lastTotalValue: '10000.50',
      lastDiversification: 7500
    }
  });

  console.log('✅ Test portfolio created:', testPortfolio.name);

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

##### **📄 Package.json (adicionar seed script):**
```json
{
  "scripts": {
    "db:seed": "ts-node prisma/seed.ts"
  }
}
```

##### **🔧 Comandos:**
```bash
# 1. Executar seed
npm run db:seed

# 2. Verificar no Prisma Studio
npx prisma studio
# Abrir http://localhost:5555 para ver dados
```

##### **📄 Redis Cache Service (src/services/cache.service.ts):**
```typescript
import { createClient, RedisClientType } from 'redis';
import { config } from '../config/environment';
import { logger } from '../utils/logger';

export class CacheService {
  private client: RedisClientType;
  private isConnected: boolean = false;

  constructor() {
    this.client = createClient({
      url: config.redisUrl
    });

    this.client.on('error', (err) => {
      logger.error('Redis client error:', err);
      this.isConnected = false;
    });

    this.client.on('connect', () => {
      logger.info('✅ Redis connected');
      this.isConnected = true;
    });
  }

  async connect(): Promise<void> {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error('Failed to connect to Redis:', error);
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (!this.isConnected) return;
      
      const stringValue = JSON.stringify(value);
      
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, stringValue);
      } else {
        await this.client.set(key, stringValue);
      }
      
      logger.debug(`Cache set: ${key}`);
    } catch (error) {
      logger.error('Cache set error:', error);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      if (!this.isConnected) return null;
      
      const value = await this.client.get(key);
      if (!value) return null;
      
      logger.debug(`Cache hit: ${key}`);
      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error:', error);
      return null;
    }
  }

  async del(key: string): Promise<void> {
    try {
      if (!this.isConnected) return;
      await this.client.del(key);
      logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      logger.error('Cache delete error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!this.isConnected) return false;
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error:', error);
      return false;
    }
  }

  isHealthy(): boolean {
    return this.isConnected;
  }
}

export const cacheService = new CacheService();
```

##### **✅ Validação da Fase 2.2:**
```bash
# 1. Verificar se seed funcionou
curl -X POST http://localhost:8000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35cc6634c0532925a3b8e4c168b7d1e9"}'

# Deve retornar nonce atualizado

# 2. Verificar Prisma Studio
npx prisma studio
# Verificar se user aparece na tabela
```

---

#### **📄 Fase 2.3: Complete Auth Flow Test (1h)**

##### **📋 Tarefas:**
1. **Testar fluxo completo de autenticação**
2. **Simular assinatura de mensagem**
3. **Validar JWT tokens**
4. **Documentar endpoints**

##### **📄 Test Script (test-auth-flow.js):**
```javascript
// Criar arquivo para testar auth flow
const ethers = require('ethers');

async function testAuthFlow() {
  console.log('🧪 Testing complete authentication flow...');
  
  // 1. Generate test wallet
  const wallet = ethers.Wallet.createRandom();
  console.log('👛 Test wallet:', wallet.address);
  
  // 2. Request nonce
  const nonceResponse = await fetch('http://localhost:8000/api/auth/nonce', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: wallet.address })
  });
  
  const nonceData = await nonceResponse.json();
  console.log('🔑 Nonce received:', nonceData.data.nonce);
  
  // 3. Sign message
  const message = nonceData.data.message;
  const signature = await wallet.signMessage(message);
  console.log('✍️ Message signed');
  
  // 4. Login with signature
  const loginResponse = await fetch('http://localhost:8000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      address: wallet.address,
      signature: signature,
      message: message
    })
  });
  
  const loginData = await loginResponse.json();
  console.log('🔐 Login result:', loginData.success);
  
  if (loginData.success) {
    console.log('🎫 JWT Token received');
    
    // 5. Test protected endpoint
    const profileResponse = await fetch('http://localhost:8000/api/auth/profile', {
      headers: { 
        'Authorization': `Bearer ${loginData.token}` 
      }
    });
    
    const profileData = await profileResponse.json();
    console.log('👤 Profile access:', profileData.success);
  }
  
  console.log('✅ Auth flow test completed!');
}

// Uncomment to run test (after installing ethers as dependency)
// testAuthFlow().catch(console.error);
```

##### **📄 Postman Collection (postman-auth.json):**
```json
{
  "info": {
    "name": "RiskGuardian Auth",
    "description": "Authentication endpoints for RiskGuardian API"
  },
  "item": [
    {
      "name": "Request Nonce",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"address\": \"{{wallet_address}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/auth/nonce",
          "host": ["{{base_url}}"],
          "path": ["api", "auth", "nonce"]
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"address\": \"{{wallet_address}}\",\n  \"signature\": \"{{signature}}\",\n  \"message\": \"{{message}}\"\n}"
        },
        "url": {
          "raw": "{{base_url}}/api/auth/login",
          "host": ["{{base_url}}"],
          "path": ["api", "auth", "login"]
        }
      }
    },
    {
      "name": "Get Profile",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}"
          }
        ],
        "url": {
          "raw": "{{base_url}}/api/auth/profile",
          "host": ["{{base_url}}"],
          "path": ["api", "auth", "profile"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "base_url",
      "value": "http://localhost:8000"
    },
    {
      "key": "wallet_address",
      "value": "0x742d35Cc6634C0532925a3b8e4C168b7d1e9"
    }
  ]
}
```

##### **✅ Validação da Fase 2.3:**
```bash
# Teste manual com curl
# 1. Request nonce
curl -X POST http://localhost:8000/api/auth/nonce \
  -H "Content-Type: application/json" \
  -d '{"address":"0x742d35Cc6634C0532925a3b8e4C168b7d1e9"}'

# 2. Manual signature (usar MetaMask ou similar)
# 3. Login (substituir signature real)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "address":"0x742d35Cc6634C0532925a3b8e4C168b7d1e9",
    "signature":"0x...",
    "message":"Welcome to RiskGuardian AI!..."
  }'

# 4. Test protected endpoint (usar token recebido)
curl -X GET http://localhost:8000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

---

### 🌤️ **TARDE (4h) - Portfolio Management**

#### **📊 Fase 2.4: Portfolio Controller (2h)**

##### **📋 Tarefas:**
1. **Implementar Portfolio Controller**
2. **Integrar com contratos blockchain**
3. **Cache de dados para performance**
4. **Endpoints CRUD para portfolios**

##### **📄 Portfolio Types (src/types/portfolio.ts):**
```typescript
export interface CreatePortfolioRequest {
  name?: string;
  description?: string;
}

export interface PortfolioResponse {
  id: string;
  name?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  positions: Position[];
  analysis?: PortfolioAnalysis;
  riskSummary?: {
    riskScore: number;
    riskLevel: string;
    riskPercentage: string;
  };
}

export interface AddPositionRequest {
  protocolAddress: string;
  tokenAddress: string;
  amount: string;
}
```

##### **📄 Portfolio Service (src/services/portfolio.service.ts):**
```typescript
import { PrismaClient } from '@prisma/client';
import { blockchainService } from './blockchain.service';
import { cacheService } from './cache.service';
import { logger } from '../utils/logger';
import { PortfolioResponse, CreatePortfolioRequest } from '../types/portfolio';

const prisma = new PrismaClient();

export class PortfolioService {

  async getUserPortfolios(userId: string): Promise<PortfolioResponse[]> {
    try {
      logger.info(`📊 Getting portfolios for user: ${userId}`);
      
      const portfolios = await prisma.portfolio.findMany({
        where: { 
          userId,
          isActive: true 
        },
        orderBy: { createdAt: 'desc' }
      });

      const portfoliosWithData = await Promise.all(
        portfolios.map(async (portfolio) => {
          return this.enrichPortfolioWithBlockchainData(portfolio);
        })
      );

      logger.info(`✅ Found ${portfolios.length} portfolios for user`);
      return portfoliosWithData;
      
    } catch (error) {
      logger.error('Error getting user portfolios:', error);
      throw new Error('Failed to fetch portfolios');
    }
  }

  async getPortfolio(portfolioId: string, userId: string): Promise<PortfolioResponse | null> {
    try {
      logger.info(`🔍 Getting portfolio: ${portfolioId}`);
      
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          userId,
          isActive: true 
        }
      });

      if (!portfolio) {
        return null;
      }

      const enrichedPortfolio = await this.enrichPortfolioWithBlockchainData(portfolio);
      
      logger.info(`✅ Portfolio found: ${portfolio.name || 'Unnamed'}`);
      return enrichedPortfolio;
      
    } catch (error) {
      logger.error('Error getting portfolio:', error);
      throw new Error('Failed to fetch portfolio');
    }
  }

  async createPortfolio(userId: string, data: CreatePortfolioRequest): Promise<PortfolioResponse> {
    try {
      logger.info(`📝 Creating portfolio for user: ${userId}`);
      
      const portfolio = await prisma.portfolio.create({
        data: {
          userId,
          name: data.name || `Portfolio ${new Date().toLocaleDateString()}`,
          description: data.description,
          isActive: true
        }
      });

      const enrichedPortfolio = await this.enrichPortfolioWithBlockchainData(portfolio);
      
      logger.info(`✅ Portfolio created: ${portfolio.id}`);
      return enrichedPortfolio;
      
    } catch (error) {
      logger.error('Error creating portfolio:', error);
      throw new Error('Failed to create portfolio');
    }
  }

  async updatePortfolio(
    portfolioId: string, 
    userId: string, 
    data: Partial<CreatePortfolioRequest>
  ): Promise<PortfolioResponse | null> {
    try {
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          userId,
          isActive: true 
        }
      });

      if (!portfolio) {
        return null;
      }

      const updatedPortfolio = await prisma.portfolio.update({
        where: { id: portfolioId },
        data: {
          name: data.name ?? portfolio.name,
          description: data.description ?? portfolio.description,
          updatedAt: new Date()
        }
      });

      const enrichedPortfolio = await this.enrichPortfolioWithBlockchainData(updatedPortfolio);
      
      logger.info(`✅ Portfolio updated: ${portfolioId}`);
      return enrichedPortfolio;
      
    } catch (error) {
      logger.error('Error updating portfolio:', error);
      throw new Error('Failed to update portfolio');
    }
  }

  async deletePortfolio(portfolioId: string, userId: string): Promise<boolean> {
    try {
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          userId,
          isActive: true 
        }
      });

      if (!portfolio) {
        return false;
      }

      // Soft delete
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      });

      // Clear cache
      await cacheService.del(`portfolio:${portfolioId}`);
      
      logger.info(`✅ Portfolio deleted: ${portfolioId}`);
      return true;
      
    } catch (error) {
      logger.error('Error deleting portfolio:', error);
      throw new Error('Failed to delete portfolio');
    }
  }

  async getPortfolioRisk(portfolioId: string, userId: string, userAddress: string) {
    try {
      logger.info(`🎯 Calculating risk for portfolio: ${portfolioId}`);
      
      // Check cache first
      const cacheKey = `portfolio:risk:${portfolioId}`;
      const cachedRisk = await cacheService.get(cacheKey);
      
      if (cachedRisk) {
        logger.info('📋 Using cached risk data');
        return cachedRisk;
      }

      // Get portfolio from database
      const portfolio = await prisma.portfolio.findFirst({
        where: { 
          id: portfolioId,
          userId,
          isActive: true 
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get real-time risk from blockchain
      const riskScore = await blockchainService.calculatePortfolioRisk(userAddress);
      const positions = await blockchainService.getUserPositions(userAddress);
      const analysis = await blockchainService.getPortfolioAnalysis(userAddress);

      // Risk level interpretation
      let riskLevel: string;
      if (riskScore < 3000) riskLevel = 'LOW';
      else if (riskScore < 6000) riskLevel = 'MEDIUM';
      else if (riskScore < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';

      const riskData = {
        portfolioId,
        riskScore,
        riskLevel,
        riskPercentage: (riskScore / 100).toFixed(2) + '%',
        positionCount: positions.length,
        totalValue: analysis?.totalValue || '0',
        diversificationScore: analysis?.diversificationScore || 0,
        calculatedAt: new Date().toISOString()
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, riskData, 300);

      // Update portfolio with latest data
      await prisma.portfolio.update({
        where: { id: portfolioId },
        data: {
          lastRiskScore: riskScore,
          lastTotalValue: analysis?.totalValue,
          lastDiversification: analysis?.diversificationScore,
          lastAnalysisAt: new Date()
        }
      });

      logger.info(`✅ Risk calculated for portfolio: ${riskScore} BP`);
      return riskData;
      
    } catch (error) {
      logger.error('Error calculating portfolio risk:', error);
      throw new Error('Failed to calculate portfolio risk');
    }
  }

  private async enrichPortfolioWithBlockchainData(portfolio: any): Promise<PortfolioResponse> {
    // Get user's address from database
    const user = await prisma.user.findUnique({
      where: { id: portfolio.userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    try {
      // Get positions from blockchain
      const positions = await blockchainService.getUserPositions(user.address);
      const analysis = await blockchainService.getPortfolioAnalysis(user.address);

      // Risk summary
      const riskScore = portfolio.lastRiskScore || analysis?.overallRisk || 0;
      let riskLevel: string;
      if (riskScore < 3000) riskLevel = 'LOW';
      else if (riskScore < 6000) riskLevel = 'MEDIUM';
      else if (riskScore < 8000) riskLevel = 'HIGH';
      else riskLevel = 'CRITICAL';

      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        isActive: portfolio.isActive,
        createdAt: portfolio.createdAt.toISOString(),
        updatedAt: portfolio.updatedAt.toISOString(),
        positions,
        analysis: analysis || undefined,
        riskSummary: {
          riskScore,
          riskLevel,
          riskPercentage: (riskScore / 100).toFixed(2) + '%'
        }
      };
    } catch (error) {
      logger.warn('Failed to enrich portfolio with blockchain data:', error);
      
      // Return basic portfolio data without blockchain info
      return {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        isActive: portfolio.isActive,
        createdAt: portfolio.createdAt.toISOString(),
        updatedAt: portfolio.updatedAt.toISOString(),
        positions: []
      };
    }
  }
}

export const portfolioService = new PortfolioService();
```

##### **📄 Portfolio Controller (src/controllers/portfolio.controller.ts):**
```typescript
import { Response } from 'express';
import { z } from 'zod';
import { AuthenticatedRequest } from '../types/auth';
import { portfolioService } from '../services/portfolio.service';
import { logger } from '../utils/logger';

// Validation schemas
const createPortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
});

const updatePortfolioSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional()
});

export class PortfolioController {

  async getUserPortfolios(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      logger.info(`📊 API: Getting portfolios for user: ${req.user.address}`);
      
      const portfolios = await portfolioService.getUserPortfolios(req.user.id);

      res.json({
        success: true,
        data: portfolios,
        count: portfolios.length,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Returned ${portfolios.length} portfolios`);
      
    } catch (error) {
      logger.error('❌ API: Error in getUserPortfolios:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolios',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { portfolioId } = req.params;

      logger.info(`🔍 API: Getting portfolio: ${portfolioId}`);
      
      const portfolio = await portfolioService.getPortfolio(portfolioId, req.user.id);

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Returned portfolio: ${portfolio.name || 'Unnamed'}`);
      
    } catch (error) {
      logger.error('❌ API: Error in getPortfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async createPortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const validation = createPortfolioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid portfolio data',
          details: validation.error.errors
        });
      }

      logger.info(`📝 API: Creating portfolio for user: ${req.user.address}`);
      
      const portfolio = await portfolioService.createPortfolio(req.user.id, validation.data);

      res.status(201).json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Portfolio created: ${portfolio.id}`);
      
    } catch (error) {
      logger.error('❌ API: Error in createPortfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updatePortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { portfolioId } = req.params;
      
      const validation = updatePortfolioSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          success: false,
          error: 'Invalid update data',
          details: validation.error.errors
        });
      }

      logger.info(`📝 API: Updating portfolio: ${portfolioId}`);
      
      const portfolio = await portfolioService.updatePortfolio(
        portfolioId, 
        req.user.id, 
        validation.data
      );

      if (!portfolio) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        data: portfolio,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Portfolio updated: ${portfolioId}`);
      
    } catch (error) {
      logger.error('❌ API: Error in updatePortfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deletePortfolio(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { portfolioId } = req.params;

      logger.info(`🗑️ API: Deleting portfolio: ${portfolioId}`);
      
      const deleted = await portfolioService.deletePortfolio(portfolioId, req.user.id);

      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: 'Portfolio not found'
        });
      }

      res.json({
        success: true,
        message: 'Portfolio deleted successfully',
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Portfolio deleted: ${portfolioId}`);
      
    } catch (error) {
      logger.error('❌ API: Error in deletePortfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete portfolio',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getPortfolioRisk(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'User not authenticated'
        });
      }

      const { portfolioId } = req.params;

      logger.info(`🎯 API: Getting risk for portfolio: ${portfolioId}`);
      
      const riskData = await portfolioService.getPortfolioRisk(
        portfolioId, 
        req.user.id, 
        req.user.address
      );

      res.json({
        success: true,
        data: riskData,
        timestamp: new Date().toISOString()
      });

      logger.info(`✅ API: Risk calculated for portfolio: ${portfolioId}`);
      
    } catch (error) {
      logger.error('❌ API: Error in getPortfolioRisk:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate portfolio risk',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
```

##### **✅ Validação da Fase 2.4:**
```bash
# Teste com token JWT válido (obtido do login)
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# 1. Criar portfolio
curl -X POST http://localhost:8000/api/portfolio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My DeFi Portfolio","description":"Testing portfolio creation"}'

# 2. Listar portfolios
curl -X GET http://localhost:8000/api/portfolio \
  -H "Authorization: Bearer $TOKEN"

# 3. Get specific portfolio
curl -X GET http://localhost:8000/api/portfolio/[portfolio-id] \
  -H "Authorization: Bearer $TOKEN"
```

---

#### **🔧 Fase 2.5: Portfolio Routes & Integration (1h)**

##### **📋 Tarefas:**
1. **Criar Portfolio Routes**
2. **Integrar todas as rotas no sistema**
3. **Testar CRUD completo**
4. **Cache optimization**

##### **📄 Portfolio Routes (src/routes/portfolio.routes.ts):**
```typescript
import { Router } from 'express';
import { PortfolioController } from '../controllers/portfolio.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
const portfolioController = new PortfolioController();

// All portfolio routes require authentication
router.use(authMiddleware);

// Portfolio CRUD
router.get('/', portfolioController.getUserPortfolios.bind(portfolioController));
router.post('/', portfolioController.createPortfolio.bind(portfolioController));
router.get('/:portfolioId', portfolioController.getPortfolio.bind(portfolioController));
router.put('/:portfolioId', portfolioController.updatePortfolio.bind(portfolioController));
router.delete('/:portfolioId', portfolioController.deletePortfolio.bind(portfolioController));

// Portfolio analysis
router.get('/:portfolioId/risk', portfolioController.getPortfolioRisk.bind(portfolioController));

export { router as portfolioRoutes };
```

##### **📄 Update Main Routes (src/routes/index.ts):**
```typescript
import { Router } from 'express';
import { registryRoutes } from './registry.routes';
import { authRoutes } from './auth.routes';
import { portfolioRoutes } from './portfolio.routes';

const router = Router();

// Health check at API level
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'RiskGuardian API is running',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Public routes
router.use('/registry', registryRoutes);
router.use('/auth', authRoutes);

// Protected routes
router.use('/portfolio', portfolioRoutes);

export { router as routes };
```

##### **📄 Initialize Cache in Main Server (src/index.ts):**
```typescript
// ... imports anteriores ...
import { cacheService } from './services/cache.service';

// ... middleware anterior ...

// Initialize services
async function initializeServices() {
  try {
    // Connect to blockchain
    const blockchainConnected = await blockchainService.connect();
    if (blockchainConnected) {
      logger.info('✅ Blockchain service connected');
    } else {
      logger.warn('⚠️ Blockchain service not connected');
    }

    // Connect to cache
    await cacheService.connect();
    
  } catch (error) {
    logger.error('Failed to initialize services:', error);
  }
}

// ... resto do código ...

const server = app.listen(config.port, async () => {
  logger.info(`🚀 RiskGuardian API running on port ${config.port}`);
  logger.info(`📊 Environment: ${config.nodeEnv}`);
  logger.info(`🔗 Blockchain: Sepolia (${config.sepoliaChainId})`);
  logger.info(`📄 Health check: http://localhost:${config.port}/health`);
  
  // Initialize services after server starts
  await initializeServices();
});

// ... resto do código ...
```

##### **✅ Validação da Fase 2.5:**
Teste CRUD completo:
```bash
# Obter token JWT válido primeiro (via login)
TOKEN="your-jwt-token"

# 1. Criar portfolio
PORTFOLIO_ID=$(curl -s -X POST http://localhost:8000/api/portfolio \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Portfolio","description":"Complete CRUD test"}' \
  | jq -r '.data.id')

echo "Created portfolio: $PORTFOLIO_ID"

# 2. Listar portfolios
curl -X GET http://localhost:8000/api/portfolio \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get portfolio específico
curl -X GET "http://localhost:8000/api/portfolio/$PORTFOLIO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Update portfolio
curl -X PUT "http://localhost:8000/api/portfolio/$PORTFOLIO_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Updated Portfolio Name"}' | jq

# 5. Get portfolio risk
curl -X GET "http://localhost:8000/api/portfolio/$PORTFOLIO_ID/risk" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Delete portfolio
curl -X DELETE "http://localhost:8000/api/portfolio/$PORTFOLIO_ID" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

#### **📊 Fase 2.6: Integration Testing & Documentation (1h)**

##### **📋 Tarefas:**
1. **Criar teste de integração completa**
2. **Documentar todos os endpoints**
3. **Performance testing**
4. **Health check completo**

##### **📄 Integration Test Script (test-integration.sh):**
```bash
#!/bin/bash

echo "🧪 RiskGuardian API Integration Test"
echo "===================================="

BASE_URL="http://localhost:8000"
TEST_ADDRESS="0x742d35cc6634c0532925a3b8e4c168b7d1e9"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success_count=0
total_tests=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local auth_header="$5"
    
    total_tests=$((total_tests + 1))
    echo -n "Testing $name... "
    
    if [[ "$method" == "POST" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            ${auth_header:+-H "$auth_header"} \
            ${data:+-d "$data"})
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            ${auth_header:+-H "$auth_header"})
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [[ "$http_code" =~ ^[23] ]]; then
        echo -e "${GREEN}✅ PASS (${http_code})${NC}"
        success_count=$((success_count + 1))
        return 0
    else
        echo -e "${RED}❌ FAIL (${http_code})${NC}"
        echo "   Response: $body"
        return 1
    fi
}

echo "🏥 Basic Health Checks"
echo "======================"
test_endpoint "Server Health" "$BASE_URL/health"
test_endpoint "API Health" "$BASE_URL/api/health"

echo ""
echo "📋 Registry Endpoints"
echo "===================="
test_endpoint "List Protocols" "$BASE_URL/api/registry/protocols"
test_endpoint "Get Uniswap V3" "$BASE_URL/api/registry/protocols/0x0227628f3F023bb0B980b67D528571c95c6DaC1c"
test_endpoint "Get Protocol Risk" "$BASE_URL/api/registry/protocols/0x0227628f3F023bb0B980b67D528571c95c6DaC1c/risk"
test_endpoint "System Health" "$BASE_URL/api/registry/health"

echo ""
echo "🔐 Authentication Flow"
echo "======================"

# Request nonce
nonce_response=$(curl -s -X POST "$BASE_URL/api/auth/nonce" \
    -H "Content-Type: application/json" \
    -d "{\"address\":\"$TEST_ADDRESS\"}")

if echo "$nonce_response" | grep -q "success.*true"; then
    echo -e "${GREEN}✅ Nonce Request PASS${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ Nonce Request FAIL${NC}"
fi
total_tests=$((total_tests + 1))

echo ""
echo "📊 Protected Endpoints (without auth)"
echo "====================================="
test_endpoint "Portfolio List (no auth)" "$BASE_URL/api/portfolio"

echo ""
echo "📈 Performance Tests"
echo "==================="

start_time=$(date +%s.%N)
curl -s "$BASE_URL/api/registry/protocols" > /dev/null
end_time=$(date +%s.%N)
response_time=$(echo "$end_time - $start_time" | bc)

if (( $(echo "$response_time < 2.0" | bc -l) )); then
    echo -e "${GREEN}✅ Response Time: ${response_time}s (< 2s)${NC}"
    success_count=$((success_count + 1))
else
    echo -e "${RED}❌ Response Time: ${response_time}s (> 2s)${NC}"
fi
total_tests=$((total_tests + 1))

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total Tests: $total_tests"
echo "Passed: $success_count"
echo "Failed: $((total_tests - success_count))"

if [[ "$success_count" -eq "$total_tests" ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed${NC}"
    exit 1
fi
```

##### **📄 API Documentation (api-docs.md):**
```markdown
# RiskGuardian API Documentation

## Base URL
```
http://localhost:8000/api
```

## Authentication
All protected endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Health & Status
- `GET /health` - API health check
- `GET /registry/health` - System health with blockchain status

### Registry (Public)
- `GET /registry/protocols` - List all DeFi protocols
- `GET /registry/protocols/:address` - Get specific protocol
- `GET /registry/protocols/:address/risk` - Get protocol risk metrics

### Authentication
- `POST /auth/nonce` - Request nonce for signing
- `POST /auth/login` - Login with signature
- `GET /auth/profile` - Get user profile (protected)
- `POST /auth/logout` - Logout (protected)

### Portfolio Management (Protected)
- `GET /portfolio` - List user portfolios
- `POST /portfolio` - Create new portfolio
- `GET /portfolio/:id` - Get specific portfolio
- `PUT /portfolio/:id` - Update portfolio
- `DELETE /portfolio/:id` - Delete portfolio
- `GET /portfolio/:id/risk` - Calculate portfolio risk

## Response Format
All responses follow this format:
```json
{
  "success": true,
  "data": { /* response data */ },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Error responses:
```json
{
  "success": false,
  "error": "Error message",
  "message": "Detailed error description"
}
```
```

##### **✅ Validação da Fase 2.6:**
```bash
# 1. Executar teste de integração
chmod +x test-integration.sh
./test-integration.sh

# 2. Verificar documentação
curl -s http://localhost:8000/api/registry/protocols | jq '.data | length'
# Deve retornar: 3

# 3. Performance check
time curl -s http://localhost:8000/api/registry/protocols > /dev/null
# Deve ser < 2 segundos
```

---

## 📊 **END OF DAY 2 - Complete Validation**

### ✅ **Technical Success Criteria**
- [ ] ✅ Web3 authentication working (nonce + signature)
- [ ] ✅ JWT token generation and validation
- [ ] ✅ Protected routes with auth middleware
- [ ] ✅ Portfolio CRUD operations
- [ ] ✅ Database integration with Prisma
- [ ] ✅ Cache layer with Redis
- [ ] ✅ Error handling and logging
- [ ] ✅ Input validation with Zod

### ✅ **Functional Success Criteria**
- [ ] ✅ Complete auth flow (nonce → sign → login → access)
- [ ] ✅ Portfolio management (create, read, update, delete)
- [ ] ✅ Real-time portfolio risk calculation
- [ ] ✅ Blockchain data integration
- [ ] ✅ Performance under 2 seconds
- [ ] ✅ 15+ working endpoints

### ✅ **Business Success Criteria**
- [ ] ✅ User can authenticate with MetaMask
- [ ] ✅ User can manage multiple portfolios
- [ ] ✅ Real DeFi risk calculations
- [ ] ✅ Secure JWT-based sessions
- [ ] ✅ Ready for frontend integration

---

## 🎉 **Day 2 Success State**

Se tudo funcionou, você terá:

### **🔐 Complete Authentication System**
- ✅ **Web3 Login**: MetaMask signature verification
- ✅ **JWT Tokens**: Secure session management
- ✅ **Protected Routes**: Auth middleware working
- ✅ **User Management**: Database-backed user system

### **📊 Portfolio Management System**
- ✅ **CRUD Operations**: Full portfolio lifecycle
- ✅ **Real Blockchain Data**: Live DeFi integrations
- ✅ **Risk Calculations**: Accurate risk scoring
- ✅ **Performance Optimized**: Cache layer active

### **🎯 API Completeness**
- ✅ **15+ Endpoints**: Auth + Registry + Portfolio
- ✅ **Consistent Responses**: Standardized JSON format
- ✅ **Error Handling**: Proper HTTP status codes
- ✅ **Documentation**: Complete API documentation

---

## 🚀 **Ready for Day 3**

**Tomorrow's options:**
1. **Advanced Features**: Insurance, Alerts, Oracle integration
2. **Frontend Integration**: Start connecting React app
3. **Testing**: Unit tests, integration tests
4. **Performance**: Optimization and scaling

**🎯 Recommendation: Advanced Features to complete the backend before moving to frontend!**