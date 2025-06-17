# 🛡️ RiskGuardian AI

Sistema inteligente de análise de risco e automação de hedge para portfólios DeFi, utilizando Chainlink CCIP para operações cross-chain.

## 🎯 Visão Geral

O RiskGuardian AI é uma plataforma avançada que combina contratos inteligentes e automação para proteger portfólios DeFi através de operações de hedge automatizadas entre diferentes blockchains. O sistema utiliza Chainlink Automation para execução de estratégias e CCIP (Cross-Chain Interoperability Protocol) para comunicação entre redes.

## 📡 Serviços e Portas

### Frontend (Next.js)

- Porta: 3000
- URL: <http://localhost:3000>
- Comandos:

  ```bash
  # Docker
  docker compose up -d frontend
  docker compose logs -f frontend
  
  # Local
  cd frontend
  npm install
  npm run dev
  ```

### Backend (Node.js)

- Porta: 8002
- URL: <http://localhost:8002>
- Comandos:

  ```bash
  # Docker
  docker compose up -d backend
  docker compose logs -f backend
  
  # Local
  cd backend
  npm install
  npm run dev
  ```

### ElizaOS Agent (IA)

- Porta: 3001
- URL: <http://localhost:3001>
- WebSocket: ws://localhost:3001

#### Comandos Básicos

```bash
# Docker
docker compose up -d elizaos-agent
docker compose logs -f elizaos-agent

# Local
cd elizaos-agent
npm install
npm run dev
```

#### Endpoints REST

```bash
# Status do serviço
curl http://localhost:3001/api/health

# Análise de portfólio
curl -X POST http://localhost:3001/api/analyze-portfolio \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B",
    "chain": "ethereum"
  }'

# Análise de risco
curl -X POST http://localhost:3001/api/analyze-risk \
  -H "Content-Type: application/json" \
  -d '{
    "portfolio": {
      "assets": [
        {"token": "ETH", "amount": "10.5"},
        {"token": "USDC", "amount": "5000"}
      ]
    }
  }'

# Previsão de mercado
curl -X POST http://localhost:3001/api/market-prediction \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ETH",
    "timeframe": "1d"
  }'
```

#### WebSocket API

```javascript
// Exemplo de conexão WebSocket
const ws = new WebSocket('ws://localhost:3001');

// Enviar mensagem
ws.send(JSON.stringify({
  type: 'analyze_portfolio',
  data: {
    address: '0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B'
  }
}));

// Receber atualizações
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Atualização:', data);
};
```

#### Serviços Internos

1. AI Agent Service

```bash
# Verificar status do serviço de IA
curl http://localhost:3001/api/ai/status

# Testar modelo específico
curl -X POST http://localhost:3001/api/ai/test \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "prompt": "Analise este portfólio"
  }'
```

2. Blockchain Service

```bash
# Verificar conexão com as redes
curl http://localhost:3001/api/blockchain/status

# Buscar saldo de tokens
curl -X GET http://localhost:3001/api/blockchain/balance \
  -H "Content-Type: application/json" \
  -d '{
    "address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B",
    "chain": "ethereum"
  }'
```

3. Cache Service

```bash
# Verificar status do cache
curl http://localhost:3001/api/cache/status

# Limpar cache
curl -X POST http://localhost:3001/api/cache/clear
```

4. WebSocket Service

```bash
# Verificar conexões ativas
curl http://localhost:3001/api/websocket/connections

# Estatísticas de uso
curl http://localhost:3001/api/websocket/stats
```

#### Monitoramento e Debug

```bash
# Logs em tempo real
docker compose logs -f elizaos-agent

# Métricas de performance
curl http://localhost:3001/api/metrics

# Status dos serviços
curl http://localhost:3001/api/health/detailed

# Uso de memória
curl http://localhost:3001/api/system/memory

# Conexões ativas
curl http://localhost:3001/api/system/connections
```

#### Scripts de Manutenção

```bash
# Reiniciar serviço
docker compose restart elizaos-agent

# Atualizar dependências
cd elizaos-agent && npm update

# Limpar logs
> elizaos-agent/logs/app.log

# Backup de configurações
cp elizaos-agent/.env-dev elizaos-agent/.env-dev.backup
```

### Chromia Node (Mock)

- Porta: 7740
- URL: <http://localhost:7740>
- Comandos:

  ```bash
  docker compose up -d chromia-node
  docker compose logs -f chromia-node
  ```

### PostgreSQL

- Porta: 5432
- Credenciais padrão:
  - Database: chromia
  - Usuário: chromia
  - Senha: chromia_password
- Comandos:

  ```bash
  # Iniciar
  docker compose up -d postgres
  
  # Backup
  docker compose exec postgres pg_dump -U chromia > backup.sql
  
  # Restaurar
  docker compose exec -T postgres psql -U chromia < backup.sql
  ```

### Redis

- Porta: 6379
- Comandos:

  ```bash
  # Iniciar
  docker compose up -d redis
  
  # CLI
  docker compose exec redis redis-cli
  ```

### Anvil (Ethereum Local)

- Porta: 8545
- URL: <http://localhost:8545>
- Chain ID: 31337
- Comandos:

  ```bash
  docker compose up -d anvil
  docker compose logs -f anvil
  ```

## 🔧 Comandos Úteis

### Docker Compose

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Parar e remover volumes
docker compose down -v

# Reconstruir todos os serviços
docker compose up -d --build

# Status dos serviços
docker compose ps

# Uso de recursos
docker compose top
```

### Scripts de Desenvolvimento

```bash
# Compilar contratos
npm run compile

# Executar testes
npm run test

# Deploy na testnet Sepolia
npm run deploy:sepolia

# Deploy na testnet Fuji
npm run deploy:fuji

# Estimar taxas CCIP
npm run estimate-fees

# Verificar saldo LINK
npm run check-link-balance

# Aprovar gastos LINK
npm run approve-link
```

### Limpeza e Manutenção

```bash
# Limpar cache do Docker
./scripts/docker-cleanup.sh

# Parar todos os serviços
./scripts/stop.sh

# Iniciar ambiente de desenvolvimento
./scripts/start-dev.sh
```

### Testes de API

```bash
# Teste do ElizaOS Agent
curl -X POST http://localhost:3001/api/analyze-portfolio \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B"}'

# Teste do Backend
curl -X POST http://localhost:8002/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B"}'
```

## 🔐 Configuração

### Variáveis de Ambiente

#### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:8002
NEXT_PUBLIC_ELIZAOS_URL=http://localhost:3001
```

#### Backend (.env-dev)

```env
# Server
PORT=8002
NODE_ENV=development
LOG_LEVEL=debug

# Database
DATABASE_URL=postgresql://chromia:chromia_password@localhost:5432/chromia

# Redis
REDIS_URL=redis://localhost:6379

# Blockchain
ETHEREUM_RPC_URL=http://localhost:8545
POLYGON_RPC_URL=https://polygon-mumbai.infura.io/v3/your-key
BSC_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
```

#### ElizaOS Agent (.env-dev)

```env
# Server
PORT=3001
NODE_ENV=development
LOG_LEVEL=debug
CORS_ORIGIN=*

# API Keys (opcional - serviço funcionará em modo mock se não fornecidas)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Cache
CACHE_TTL=5
CACHE_CHECK_PERIOD=1

# Models
OPENAI_MODEL=gpt-4-turbo-preview
ANTHROPIC_MODEL=claude-3-opus-20240229
```

#### Blockchain (.env)

```env
# RPCs
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-key
FUJI_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc

# Chaves
PRIVATE_KEY=sua_chave_privada
ETHERSCAN_API_KEY=sua_chave_etherscan

# Contratos
LINK_TOKEN_ADDRESS=0x779877A7B0D9E8603169DdbD7836e478b4624789
CCIP_ROUTER_ADDRESS=0x0BF3dE8c5D3e8A2B34D2BEeB17ABfCeBaf363A59

# Chain Selectors
CHAIN_SELECTOR_FUJI=0x84
CHAIN_SELECTOR_SEPOLIA=0x1
```

## ✨ Funcionalidades Principais

### 🔄 Operações Cross-Chain

- Hedge automatizado entre diferentes blockchains via CCIP
- Suporte inicial para Ethereum (Sepolia) e Avalanche (Fuji)
- Monitoramento de taxas e slippage
- Execução segura de transações cross-chain

### 🤖 Automação de Hedge

- Execução automática via Chainlink Automation
- Estratégias de proteção configuráveis
- Monitoramento de preços em tempo real
- Rebalanceamento automático de posições

### 🔐 Segurança

- Validações rigorosas de transações
- Proteções contra slippage
- Monitoramento de taxas
- Verificações de saldo e allowance

### 📊 Monitoramento

- Acompanhamento de transações cross-chain
- Alertas de status de operações
- Monitoramento de saldos LINK
- Estimativas de taxas em tempo real

## 🛠️ Tecnologias

### Smart Contracts

- Solidity 0.8.x
- Hardhat
- Chainlink CCIP 0.7.6
- Chainlink Automation
- OpenZeppelin Contracts 4.9.3

### Backend

- Node.js & TypeScript
- Ethers.js 5.7.2
- Sistema de logging estruturado
- Gerenciamento de ambiente via dotenv

## 🚀 Começando

### Pré-requisitos

- Docker e Docker Compose
- Node.js 18+
- npm ou yarn
- PostgreSQL (opcional, para desenvolvimento local sem Docker)
- Redis (opcional, para desenvolvimento local sem Docker)

### Instalação com Docker (Recomendado)

1. Clone o repositório:

```bash
git clone https://github.com/seu-usuario/riskguardian-ai.git
cd riskguardian-ai
```

2. Configure as variáveis de ambiente:

```bash
# Crie o arquivo .env na raiz do projeto
cp .env.example .env

# Edite o arquivo .env com suas configurações:
# - Chaves de API (opcional - serviço funcionará em modo mock se não fornecidas)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
OPENROUTER_API_KEY=
CHAINLINK_API_KEY=
ETHERSCAN_API_KEY=
ALCHEMY_API_KEY=

# - Configurações de IA
AI_PROVIDER=openai
AI_MODEL_RISK=gpt-4-turbo-preview
AI_MODEL_CHAT=gpt-4-turbo-preview
AI_MODEL_DATA=gpt-4-turbo-preview
AI_MODEL_FALLBACK=gpt-3.5-turbo

# - Segurança
JWT_SECRET=seu_jwt_secret
PRIVATE_KEY=sua_chave_privada
```

3. Inicie os serviços:

```bash
# Inicia todos os serviços em modo detached
docker compose up -d

# Para ver os logs de todos os serviços
docker compose logs -f

# Para ver logs de um serviço específico
docker compose logs -f elizaos-agent
```

### Instalação Local (Desenvolvimento)

1. Instale as dependências em cada componente:

```bash
# Frontend
cd frontend
npm install
cp .env.example .env.local
# Configure .env.local

# Backend
cd ../backend
npm install
cp .env.example .env-dev
# Configure .env-dev

# ElizaOS Agent
cd ../elizaos-agent
npm install
cp .env.example .env-dev
# Configure .env-dev
```

2. Inicie os serviços individualmente:

```bash
# Frontend
cd frontend
npm run dev

# Backend
cd backend
npm run dev

# ElizaOS Agent
cd elizaos-agent
npm run dev
```

## 📡 Service Ports and Configuration

### Frontend (Next.js)

- Porta: 3000
- URL: <http://localhost:3000>
- Comandos Docker:

  ```bash
  # Iniciar apenas o frontend
  docker compose up -d frontend
  
  # Reconstruir e reiniciar
  docker compose up -d --build frontend
  
  # Logs
  docker compose logs -f frontend
  ```

### Backend (Node.js)

- Porta: 8002
- URL: <http://localhost:8002>
- Endpoints principais:
  - GET /api/health - Status do serviço
  - POST /api/analyze - Análise de portfólio
- Comandos Docker:

  ```bash
  # Iniciar apenas o backend
  docker compose up -d backend
  
  # Reconstruir e reiniciar
  docker compose up -d --build backend
  
  # Logs
  docker compose logs -f backend
  ```

### ElizaOS Agent (IA)

- Porta: 3001
- URL: <http://localhost:3001>
- Endpoints principais:
  - POST /api/analyze-portfolio - Análise de portfólio com IA
  - GET /api/health - Status do serviço
- Comandos Docker:

  ```bash
  # Iniciar apenas o ElizaOS Agent
  docker compose up -d elizaos-agent
  
  # Reconstruir e reiniciar
  docker compose up -d --build elizaos-agent
  
  # Logs
  docker compose logs -f elizaos-agent
  ```

### Chromia Node (Mock)

- Porta: 7740
- URL: <http://localhost:7740>
- Comandos Docker:

  ```bash
  # Iniciar apenas o Chromia Node
  docker compose up -d chromia-node
  
  # Logs
  docker compose logs -f chromia-node
  ```

### PostgreSQL

- Porta: 5432
- Credenciais padrão:
  - Database: chromia
  - Usuário: chromia
  - Senha: chromia_password
- Comandos Docker:

  ```bash
  # Iniciar apenas o PostgreSQL
  docker compose up -d postgres
  
  # Backup do banco
  docker compose exec postgres pg_dump -U chromia > backup.sql
  
  # Restaurar backup
  docker compose exec -T postgres psql -U chromia < backup.sql
  ```

### Redis Cache Service

- Porta: 6379
- Comandos Docker:

  ```bash
  # Iniciar apenas o Redis
  docker compose up -d redis
  
  # CLI do Redis
  docker compose exec redis redis-cli
  ```

### Anvil (Ethereum Local)

- Porta: 8545
- URL: <http://localhost:8545>
- Chain ID: 31337
- Comandos Docker:

  ```bash
  # Iniciar apenas o Anvil
  docker compose up -d anvil
  
  # Logs
  docker compose logs -f anvil
  ```

### PGAdmin (Interface PostgreSQL)

- Porta: 5050
- URL: <http://localhost:5050>
- Credenciais padrão:
  - Email: <admin@riskguardian.ai>
  - Senha: admin123
- Comandos Docker:

  ```bash
  # Iniciar PGAdmin (perfil tools)
  docker compose --profile tools up -d pgadmin
  ```

## 🔧 Comandos Úteis

### Docker Compose

```bash
# Iniciar todos os serviços
docker compose up -d

# Parar todos os serviços
docker compose down

# Parar e remover volumes
docker compose down -v

# Reconstruir todos os serviços
docker compose up -d --build

# Status dos serviços
docker compose ps

# Uso de recursos
docker compose top
```

### Development Scripts and Commands

```bash
# Compilar contratos
npm run compile

# Executar testes
npm run test

# Deploy na testnet Sepolia
npm run deploy:sepolia

# Deploy na testnet Fuji
npm run deploy:fuji

# Estimar taxas CCIP
npm run estimate-fees

# Verificar saldo LINK
npm run check-link-balance

# Aprovar gastos LINK
npm run approve-link
```

### System Cleanup and Maintenance

```bash
# Limpar cache do Docker
./scripts/docker-cleanup.sh

# Parar todos os serviços
./scripts/stop.sh

# Iniciar ambiente de desenvolvimento
./scripts/start-dev.sh
```

## 📝 Testes

### Teste do ElizaOS Agent

```bash
# Análise de portfólio
curl -X POST http://localhost:3001/api/analyze-portfolio \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B"}'

# Status do serviço
curl http://localhost:3001/api/health
```

### Teste do Backend

```bash
# Status do serviço
curl http://localhost:8002/api/health

# Análise de portfólio
curl -X POST http://localhost:8002/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"address": "0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B"}'
```

## 🔒 Segurança

### Práticas de Segurança

- Validação rigorosa de parâmetros
- Verificações de saldo e allowance
- Proteções contra slippage
- Monitoramento de taxas

### Gerenciamento de Chaves

- Uso de variáveis de ambiente para chaves
- Nunca commitar arquivos .env
- Rotação regular de chaves recomendada

## 📊 Monitoramento

### Logs & Verificações

- Logs estruturados por operação
- Verificações de status de transações
- Monitoramento de saldos
- Acompanhamento de taxas

## 🔧 Configuração

### Variáveis de Ambiente Principais

```env
# Blockchain
PRIVATE_KEY=sua_chave_privada
SEPOLIA_RPC_URL=url_do_nó_sepolia
FUJI_RPC_URL=url_do_nó_fuji

# Contratos
LINK_TOKEN_ADDRESS=endereço_do_token_link
CCIP_ROUTER_ADDRESS=endereço_do_router_ccip

# Configurações
CHAIN_SELECTOR_FUJI=0x84
CHAIN_SELECTOR_SEPOLIA=0x1
```

## 📝 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor, leia nosso [guia de contribuição](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e processo de submissão de pull requests.
