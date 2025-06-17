# 🛡️ RiskGuardian AI - Documentação Técnica

## 📋 Visão Geral do Projeto

O RiskGuardian AI é uma plataforma avançada de análise e gerenciamento de riscos para portfólios DeFi, combinando blockchain, inteligência artificial e automação para proteger investimentos através de operações de hedge automatizadas entre diferentes blockchains.

### Principais Funcionalidades
- Análise de risco em tempo real de portfólios DeFi
- Automação de hedge cross-chain via Chainlink CCIP
- Sistema de alertas e monitoramento
- Interface intuitiva para gestão de riscos
- Integração com múltiplos protocolos DeFi

```mermaid
graph TD
    A[Frontend Next.js] --> B[Backend Node.js]
    B --> C[ElizaOS AI Agent]
    B --> D[Smart Contracts]
    D --> E[Chainlink CCIP]
    D --> F[Chainlink Automation]
    B --> G[PostgreSQL]
    B --> H[Redis Cache]
    B --> I[Chromia Node]
    C --> J[OpenAI/Anthropic]
    E --> K[Cross-Chain Operations]
    F --> L[Automated Hedging]
```

## 🏗️ Arquitetura do Sistema

### Componentes Principais

```mermaid
classDiagram
    class Frontend {
        +Next.js
        +React Components
        +Web3 Integration
        +Risk Dashboard
    }
    class Backend {
        +Node.js
        +Express API
        +Business Logic
        +Blockchain Integration
    }
    class ElizaOSAgent {
        +AI Analysis
        +Risk Assessment
        +Portfolio Monitoring
        +Real-time Chat
    }
    class SmartContracts {
        +Risk Management
        +Chainlink Integration
        +Cross-chain Operations
        +Automated Hedging
    }
    class Database {
        +PostgreSQL
        +Redis Cache
        +Chromia Storage
    }
    Frontend --> Backend
    Backend --> ElizaOSAgent
    Backend --> SmartContracts
    Backend --> Database
```

### Portas e Serviços

```mermaid
graph LR
    A[Frontend :3000] --> B[Nginx Proxy]
    B --> C[Backend :8000]
    B --> D[ElizaOS :3001]
    B --> E[Chromia :7740]
    B --> F[Anvil :8545]
    C --> G[PostgreSQL :5432]
    C --> H[Redis :6379]
```

## 🔄 Fluxos de Operação

### Fluxo de Análise de Risco

```mermaid
sequenceDiagram
    participant U as Usuário
    participant F as Frontend
    participant B as Backend
    participant E as ElizaOS
    participant AI as AI Models
    participant BC as Blockchain
    
    U->>F: Solicita análise de portfólio
    F->>B: POST /api/analyze
    B->>BC: Consulta dados on-chain
    B->>E: Solicita análise de risco
    E->>AI: Processa dados
    AI->>E: Retorna análise
    E->>B: Envia resultados
    B->>F: Retorna análise completa
    F->>U: Exibe dashboard de risco
```

### Fluxo de Hedge Automatizado

```mermaid
sequenceDiagram
    participant CL as Chainlink Automation
    participant SC as Smart Contracts
    participant CCIP as Chainlink CCIP
    participant BC1 as Blockchain 1
    participant BC2 as Blockchain 2
    
    CL->>SC: Verifica condições
    SC->>BC1: Checa preços/riscos
    SC->>CCIP: Inicia operação cross-chain
    CCIP->>BC2: Executa hedge
    BC2->>CCIP: Confirma execução
    CCIP->>SC: Retorna status
    SC->>CL: Atualiza estado
```

## 🗄️ Estrutura de Dados

### Modelo de Dados Principal

```mermaid
erDiagram
    USER ||--o{ PORTFOLIO : has
    PORTFOLIO ||--o{ ASSET : contains
    PORTFOLIO ||--o{ RISK_ANALYSIS : generates
    RISK_ANALYSIS ||--o{ HEDGE_STRATEGY : creates
    HEDGE_STRATEGY ||--o{ HEDGE_OPERATION : executes
    
    USER {
        string id
        string address
        string email
        timestamp created_at
    }
    PORTFOLIO {
        string id
        string user_id
        string name
        float total_value
    }
    ASSET {
        string id
        string portfolio_id
        string token_address
        float amount
    }
    RISK_ANALYSIS {
        string id
        string portfolio_id
        float risk_score
        json analysis_data
        timestamp created_at
    }
    HEDGE_STRATEGY {
        string id
        string analysis_id
        string type
        json parameters
    }
    HEDGE_OPERATION {
        string id
        string strategy_id
        string status
        timestamp executed_at
    }
```

## 🛠️ Componentes Técnicos

### Frontend (Next.js)
- **Porta**: 3000
- **Tecnologias**: React, TypeScript, Web3.js
- **Principais Componentes**:
  - Dashboard de Risco
  - Interface de Portfólio
  - Painel de Controle de Hedge
  - Chat com IA

### Backend (Node.js)
- **Porta**: 8000
- **Tecnologias**: Express, TypeScript, Ethers.js
- **Funcionalidades**:
  - API RESTful
  - Integração Blockchain
  - Gerenciamento de Usuários
  - Processamento de Dados

### ElizaOS Agent (IA)
- **Porta**: 3001
- **Tecnologias**: Node.js, OpenAI/Anthropic
- **Capacidades**:
  - Análise de Risco
  - Processamento de Linguagem Natural
  - Recomendações de Hedge
  - Chat em Tempo Real

### Smart Contracts (Solidity)
- **Redes**: Ethereum (Sepolia), Avalanche (Fuji)
- **Frameworks**: Hardhat, Chainlink
- **Contratos**:
  - RiskRegistry
  - HedgeAutomation
  - CrossChainHedge
  - AlertSystem

## 🔒 Segurança e Monitoramento

### Camadas de Segurança

```mermaid
graph TD
    A[Autenticação JWT] --> B[Validação de Entrada]
    B --> C[Rate Limiting]
    C --> D[Sanitização de Dados]
    D --> E[Proteção CSRF]
    E --> F[Validações On-chain]
    F --> G[Monitoramento de Taxas]
    G --> H[Proteção contra Slippage]
```

### Sistema de Monitoramento

```mermaid
graph LR
    A[Logs Estruturados] --> B[Alertas em Tempo Real]
    B --> C[Monitoramento de Saldo]
    C --> D[Status de Transações]
    D --> E[Métricas de Performance]
    E --> F[Relatórios de Saúde]
    F --> G[Notificações]
```

## 🚀 Ambiente de Desenvolvimento

### Setup do Ambiente
1. **Pré-requisitos**:
   - Docker e Docker Compose
   - Node.js 18+
   - Git

2. **Instalação**:
```bash
git clone https://github.com/seu-usuario/riskguardian-ai.git
cd riskguardian-ai
cp .env.example .env
./scripts/setup.sh
```

3. **Iniciar Desenvolvimento**:
```bash
./scripts/start-dev.sh
```

### Estrutura de Diretórios
```
riskguardian-ai/
├── frontend/          # Interface do usuário
├── backend/           # API e lógica de negócios
├── elizaos-agent/     # Agente de IA
├── contracts/         # Smart contracts
├── chromia/           # Nó Chromia
├── scripts/          # Scripts de automação
└── docs/             # Documentação
```

## 📊 Métricas e Monitoramento

### Endpoints de Saúde
- Frontend: `http://localhost:3000/health`
- Backend: `http://localhost:8000/health`
- ElizaOS: `http://localhost:3001/health`
- Chromia: `http://localhost:7740/health`

### Logs e Diagnósticos
```bash
# Visualizar logs
docker-compose logs -f [serviço]

# Status dos containers
docker-compose ps

# Métricas de recursos
docker stats
```

## 🔧 Configuração

### Variáveis de Ambiente Principais
```env
# AI
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-ant-xxx
OPENROUTER_API_KEY=sk-or-xxx

# Blockchain
CHAINLINK_API_KEY=xxx
ETHERSCAN_API_KEY=xxx
ALCHEMY_API_KEY=xxx

# Segurança
JWT_SECRET=xxx
```

## 📝 Documentação Adicional

- [Guia de Contribuição](CONTRIBUTING.md)
- [Documentação da API](api-docs.md)
- [Smart Contracts](SMART_CONTRACTS.md)
- [Guia de Segurança](SECURITY.md)

## 🤝 Suporte e Contribuição

Para suporte técnico ou dúvidas:
- Email: support@riskguardian.ai
- GitHub Issues: [Criar Issue](https://github.com/seu-usuario/riskguardian-ai/issues)

Para contribuir:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Faça commit das mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes. 