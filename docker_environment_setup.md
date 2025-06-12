# RiskGuardian AI - Setup Docker Completo

## 🐳 **Estrutura do Projeto**

```
riskguardian-ai/
├── docker-compose.yml           # Orquestração principal
├── docker-compose.dev.yml       # Overrides para desenvolvimento
├── .env.example                 # Template de variáveis
├── .env                         # Variáveis de ambiente (gitignore)
├── nginx.conf                   # Configuração proxy
├── scripts/
│   ├── setup.sh                 # Setup inicial
│   ├── start-dev.sh             # Start desenvolvimento
│   └── deploy.sh                # Deploy produção
├── frontend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── next.config.js
│   └── src/
├── backend/
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   └── src/
├── elizaos-agent/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
├── contracts/
│   ├── Dockerfile
│   ├── foundry.toml
│   ├── src/
│   └── script/
├── chromia/
│   ├── Dockerfile
│   ├── config/
│   └── src/
└── docs/
    └── README.md
```

---

## 🐳 **Docker Compose Principal**

### **docker-compose.yml**
```yaml
version: '3.8'

services:
  # ===== FRONTEND LAYER =====
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_API_URL=http://localhost:8000
      - NEXT_PUBLIC_WS_URL=ws://localhost:3001
      - NEXT_PUBLIC_CHROMIA_URL=http://localhost:7740
      - NEXT_PUBLIC_CHAIN_ID=31337
      - NEXT_PUBLIC_ETHEREUM_RPC=http://localhost:8545
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    depends_on:
      - backend
      - elizaos-agent
    networks:
      - riskguardian-network
    restart: unless-stopped

  # ===== BACKEND API LAYER =====
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    environment:
      - NODE_ENV=development
      - PORT=8000
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/riskguardian
      - REDIS_URL=redis://redis:6379
      - CHROMIA_URL=http://chromia-node:7740
      - ETHEREUM_RPC_URL=http://anvil:8545
      - JWT_SECRET=${JWT_SECRET}
      - CHAINLINK_API_KEY=${CHAINLINK_API_KEY}
    volumes:
      - ./backend:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
      - chromia-node
    networks:
      - riskguardian-network
    restart: unless-stopped

  # ===== AI AGENT LAYER =====
  elizaos-agent:
    build:
      context: ./elizaos-agent
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - CHROMIA_URL=http://chromia-node:7740
      - BACKEND_URL=http://backend:8000
      - ETHEREUM_RPC_URL=http://anvil:8545
      - CHAINLINK_NODE_URL=${CHAINLINK_NODE_URL}
    volumes:
      - ./elizaos-agent:/app
      - /app/node_modules
    depends_on:
      - backend
      - chromia-node
    networks:
      - riskguardian-network
    restart: unless-stopped

  # ===== DATABASE LAYER =====
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=riskguardian
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_MULTIPLE_DATABASES=riskguardian_test
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init:/docker-entrypoint-initdb.d
    networks:
      - riskguardian-network
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - riskguardian-network
    restart: unless-stopped

  # ===== BLOCKCHAIN LAYER =====
  chromia-node:
    build:
      context: ./chromia
      dockerfile: Dockerfile
    ports:
      - "7740:7740"
      - "7741:7741"
    environment:
      - POSTCHAIN_ENVIRONMENT=development
      - POSTCHAIN_NETWORKS=testnet
    volumes:
      - ./chromia/config:/app/config
      - ./chromia/src:/app/src
      - chromia_data:/app/data
    networks:
      - riskguardian-network
    restart: unless-stopped

  anvil:
    image: ghcr.io/foundry-rs/foundry:latest
    command: >
      anvil 
      --host 0.0.0.0 
      --port 8545 
      --chain-id 31337
      --accounts 10
      --balance 10000
      --gas-limit 30000000
      --block-time 2
    ports:
      - "8545:8545"
    networks:
      - riskguardian-network
    restart: unless-stopped

  # ===== SMART CONTRACTS LAYER =====
  contracts:
    build:
      context: ./contracts
      dockerfile: Dockerfile
    environment:
      - ETHEREUM_RPC_URL=http://anvil:8545
      - PRIVATE_KEY=${PRIVATE_KEY}
      - ETHERSCAN_API_KEY=${ETHERSCAN_API_KEY}
    volumes:
      - ./contracts:/app
      - contracts_cache:/app/cache
      - contracts_out:/app/out
    depends_on:
      - anvil
    networks:
      - riskguardian-network
    profiles:
      - tools

  # ===== MONITORING & TOOLS =====
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
      - elizaos-agent
    networks:
      - riskguardian-network
    restart: unless-stopped
    profiles:
      - production

  # Database Admin
  pgadmin:
    image: dpage/pgadmin4:latest
    environment:
      - PGADMIN_DEFAULT_EMAIL=admin@riskguardian.ai
      - PGADMIN_DEFAULT_PASSWORD=admin123
    ports:
      - "5050:80"
    depends_on:
      - postgres
    networks:
      - riskguardian-network
    profiles:
      - tools

  # Redis Admin
  redis-commander:
    image: rediscommander/redis-commander:latest
    environment:
      - REDIS_HOSTS=local:redis:6379
    ports:
      - "8081:8081"
    depends_on:
      - redis
    networks:
      - riskguardian-network
    profiles:
      - tools

# ===== NETWORKS =====
networks:
  riskguardian-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# ===== VOLUMES =====
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  chromia_data:
    driver: local
  contracts_cache:
    driver: local
  contracts_out:
    driver: local
```

---

## 🛠️ **Dockerfiles Especializados**

### **Frontend Dockerfile.dev**
```dockerfile
# frontend/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Development command with hot reload
CMD ["npm", "run", "dev"]
```

### **Backend Dockerfile.dev**
```dockerfile
# backend/Dockerfile.dev
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++

# Install dependencies
COPY package*.json ./
RUN npm ci

# Install development tools
RUN npm install -g nodemon prisma

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 8000

# Development command with hot reload
CMD ["npm", "run", "dev"]
```

### **ElizaOS Agent Dockerfile**
```dockerfile
# elizaos-agent/Dockerfile
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache python3 make g++ git

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build application
RUN npm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["npm", "start"]
```

### **Chromia Dockerfile**
```dockerfile
# chromia/Dockerfile
FROM openjdk:17-alpine

WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Download Postchain
RUN curl -L -o postchain.jar \
    https://github.com/chromaway/postchain/releases/latest/download/postchain.jar

# Copy configuration
COPY config/ ./config/
COPY src/ ./src/

# Expose ports
EXPOSE 7740 7741

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:7740/health || exit 1

# Start Postchain
CMD ["java", "-jar", "postchain.jar", "--config-file=config/node-config.properties"]
```

### **Smart Contracts Dockerfile**
```dockerfile
# contracts/Dockerfile
FROM ghcr.io/foundry-rs/foundry:latest

WORKDIR /app

# Copy foundry configuration
COPY foundry.toml ./

# Copy source code
COPY . .

# Install dependencies
RUN forge install

# Build contracts
RUN forge build

# Default command for development
CMD ["forge", "test", "--watch"]
```

---

## ⚙️ **Arquivos de Configuração**

### **.env.example**
```bash
# === DATABASE ===
DATABASE_URL=postgresql://postgres:password@localhost:5432/riskguardian
POSTGRES_PASSWORD=password

# === AUTHENTICATION ===
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NEXTAUTH_SECRET=your-nextauth-secret-key

# === API KEYS ===
OPENAI_API_KEY=sk-your-openai-api-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
CHAINLINK_API_KEY=your-chainlink-api-key

# === BLOCKCHAIN ===
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
ETHERSCAN_API_KEY=your-etherscan-api-key
ALCHEMY_API_KEY=your-alchemy-api-key

# === CHAINLINK NODE ===
CHAINLINK_NODE_URL=http://localhost:6688

# === EXTERNAL SERVICES ===
REDIS_PASSWORD=your-redis-password
```

### **nginx.conf**
```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:8000;
    }

    upstream elizaos {
        server elizaos-agent:3001;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # ElizaOS WebSocket
        location /ws/ {
            proxy_pass http://elizaos;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }
    }
}
```

### **redis.conf**
```redis
# Redis configuration for development
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

---

## 🚀 **Scripts de Automação**

### **scripts/setup.sh**
```bash
#!/bin/bash

echo "🚀 Setting up RiskGuardian AI Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📄 Created .env file from template"
    echo "⚠️  Please edit .env file with your API keys"
fi

# Create necessary directories
mkdir -p {frontend,backend,elizaos-agent,contracts,chromia}/{src,config}
mkdir -p ssl logs

# Build and start development environment
echo "🐳 Building Docker containers..."
docker-compose -f docker-compose.yml build

echo "🚀 Starting development environment..."
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec backend npx prisma migrate dev

# Deploy smart contracts
echo "⛓️ Deploying smart contracts..."
docker-compose run --rm contracts forge script script/Deploy.s.sol --broadcast

# Show status
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access points:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8000"
echo "  ElizaOS:      http://localhost:3001"
echo "  Chromia:      http://localhost:7740"
echo "  PostgreSQL:   localhost:5432"
echo "  Redis:        localhost:6379"
echo "  Anvil:        http://localhost:8545"
echo ""
echo "🛠️ Admin tools (optional):"
echo "  docker-compose --profile tools up -d"
echo "  PgAdmin:      http://localhost:5050"
echo "  Redis UI:     http://localhost:8081"
```

### **scripts/start-dev.sh**
```bash
#!/bin/bash

echo "🚀 Starting RiskGuardian AI Development Environment"

# Start core services
docker-compose up -d

# Show logs
docker-compose logs -f
```

### **scripts/stop.sh**
```bash
#!/bin/bash

echo "🛑 Stopping RiskGuardian AI Environment"

# Stop all services
docker-compose down

# Optional: Remove volumes (uncomment if needed)
# docker-compose down -v
```

---

## 📋 **Comandos Úteis**

### **Desenvolvimento Diário**
```bash
# Start ambiente completo
./scripts/start-dev.sh

# Stop ambiente
./scripts/stop.sh

# Rebuild serviço específico
docker-compose build frontend
docker-compose up -d frontend

# Ver logs de serviço específico
docker-compose logs -f backend

# Executar comando em container
docker-compose exec backend npm run migrate
docker-compose exec frontend npm run build

# Resetar banco de dados
docker-compose exec backend npx prisma migrate reset

# Backup banco
docker-compose exec postgres pg_dump -U postgres riskguardian > backup.sql
```

### **Debugging**
```bash
# Shell em container
docker-compose exec backend sh
docker-compose exec frontend sh

# Verificar status
docker-compose ps

# Verificar logs de erro
docker-compose logs backend | grep ERROR

# Rebuild tudo do zero
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

---

## 🎯 **Próximos Passos**

### **1. Setup Inicial**
```bash
# Clone e setup
git clone <repo>
cd riskguardian-ai
chmod +x scripts/*.sh
./scripts/setup.sh
```

### **2. Desenvolvimento**
```bash
# Start development
./scripts/start-dev.sh

# Em terminais separados, trabalhe em:
# - frontend/src (Next.js)
# - backend/src (Node.js)
# - elizaos-agent/src (AI Agent)
# - contracts/src (Solidity)
# - chromia/src (Rell)
```

### **3. Testing**
```bash
# Test frontend
docker-compose exec frontend npm test

# Test backend
docker-compose exec backend npm test

# Test contracts
docker-compose exec contracts forge test
```

**Environment Docker completo pronto! Quer que eu crie algum dos arquivos específicos ou começamos a implementar algum serviço?** 🚀