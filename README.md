# 🛡️ RiskGuardian AI

Sistema inteligente de análise de risco e automação de hedge para portfólios DeFi, utilizando múltiplos modelos de IA e contratos inteligentes.

## 🎯 Visão Geral

O RiskGuardian AI é uma plataforma avançada que combina inteligência artificial e contratos inteligentes para analisar e proteger portfólios DeFi. O sistema utiliza GPT-4 e Claude para análises, junto com Chainlink Automation e CCIP para execução automatizada de estratégias de hedge.

## ✨ Funcionalidades Principais

### 🔍 Análise de Portfólio
- Avaliação em tempo real de posições DeFi
- Cálculo de métricas de risco (fator de saúde, razão de colateral)
- Detecção de exposição excessiva
- Análise de diversificação

### 🤖 Automação de Hedge
- Execução automática via Chainlink Automation
- Estratégias de stop loss e take profit
- Rebalanceamento cross-chain via CCIP
- Monitoramento de preços em tempo real

### 💡 Explicações Inteligentes
- Tradução de métricas técnicas para linguagem simples
- Identificação dos principais riscos
- Sugestões de otimização
- Conteúdo educacional sobre DeFi

### 📊 Monitoramento de Mercado
- Acompanhamento de tendências em tempo real
- Alertas de volatilidade
- Detecção de anomalias
- Oportunidades de arbitragem

## 🛠️ Tecnologias

### Smart Contracts
- Solidity & Hardhat
- Chainlink Automation & CCIP
- OpenZeppelin Contracts
- Gelato Network Automation

### Backend (ElizaOS Agent)
- Node.js & TypeScript
- Express & WebSocket
- OpenAI & Anthropic APIs
- Cache distribuído
- Sistema de logging avançado

### Frontend
- Next.js & React
- WebSocket para updates em tempo real
- Interface responsiva
- Gráficos interativos

## 🚀 Começando

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- PostgreSQL
- Redis (opcional)

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/uederson-ferreira/riskguardian-ai.git
cd riskguardian-ai
```

2. Instale as dependências:
```bash
# Projeto principal
npm install

# Backend
cd elizaos-agent
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure o ambiente:
```bash
# Projeto principal
cp .env.example .env-dev
# Edite .env-dev com suas configurações

# Backend
cd elizaos-agent
cp .env.example .env-dev
# Edite .env-dev com suas configurações

# Frontend
cd ../frontend
cp .env.local.example .env.local
# Edite .env.local com suas configurações
```

4. Compile os contratos:
```bash
npx hardhat compile
```

5. Inicie os serviços:
```bash
# Backend
cd elizaos-agent
npm run dev

# Frontend
cd ../frontend
npm run dev
```

## 📡 Smart Contracts

### Contratos Principais

#### HedgeAutomation.sol
- Gerenciamento de estratégias de hedge
- Monitoramento de preços via Chainlink
- Execução automática de operações
- Suporte a stop loss e take profit

#### CrossChainHedge.sol
- Operações cross-chain via CCIP
- Rebalanceamento entre redes
- Verificações de slippage
- Proteções de segurança

### Deploy

Para fazer deploy na testnet Fuji:
```bash
npx hardhat deploy --network fuji
```

Para fazer deploy na mainnet Avalanche:
```bash
npx hardhat deploy --network avalanche
```

## 📡 API WebSocket

### Conexão
```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Mensagens

#### 1. Análise de Portfólio
```javascript
ws.send(JSON.stringify({
  type: 'analyze',
  address: '0x742d35Cc6635C0532925a3b8D0D8f8Cc86d0AB8B',
  content: 'Analise meu portfólio DeFi'
}));
```

#### 2. Histórico de Análises
```javascript
ws.send(JSON.stringify({
  type: 'history'
}));
```

### Respostas

#### 1. Resultado de Análise
```javascript
{
  type: 'analysis_result',
  content: {
    riskLevel: 'moderado',
    totalValue: 25000,
    healthFactor: 2.1,
    mainRisks: [
      'Alta concentração em tokens voláteis',
      'Posição alavancada em DEX'
    ],
    recommendations: [
      'Considere diversificar 20% para stablecoins',
      'Aumente o colateral para melhorar o fator de saúde'
    ],
    explanation: 'Seu portfólio apresenta...'
  }
}
```

## 🔒 Segurança

### Smart Contracts
- Auditorias de segurança
- Verificações de slippage
- Proteções contra reentrância
- Padrões OpenZeppelin

### Proteção de Dados
- Validação rigorosa de inputs
- Sanitização de dados
- Rate limiting por IP
- CORS configurável

### Autenticação & Autorização
- JWT para autenticação
- Controle granular de permissões
- Proteção contra ataques comuns
- Headers de segurança via Helmet

## 📊 Monitoramento

### Logs & Métricas
- Logs estruturados por nível
- Métricas de performance
- Estatísticas de uso da IA
- Monitoramento de WebSocket

### Cache & Performance
- Cache distribuído
- TTL configurável
- Métricas de hit/miss
- Otimização automática

## 🔧 Configuração

### Variáveis de Ambiente
```env
# Server
PORT=3000
NODE_ENV=development
LOG_LEVEL=debug

# IA
OPENAI_API_KEY=sua_chave
ANTHROPIC_API_KEY=sua_chave

# Blockchain
PRIVATE_KEY=sua_chave_privada
AVALANCHE_RPC_URL=url_do_nó
CHAINLINK_AUTOMATION_REGISTRY=endereço_do_registro

# Cache
CACHE_TTL=5
CACHE_CHECK_PERIOD=1

# Segurança
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/riskguardian

# Blockchain
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your-project-id

# Smart Contracts
RISK_REGISTRY_ADDRESS=0x...
PORTFOLIO_ANALYZER_ADDRESS=0x...

# Auth
JWT_SECRET=your-secret-key
```

## 🤝 Contribuindo

1. Faça um Fork
2. Crie sua Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add: nova funcionalidade'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## ✨ Agradecimentos

- ElizaOS Framework
- OpenAI
- Anthropic
- Chainlink
- Avalanche
- OpenZeppelin
- Comunidade DeFi
- Todos os contribuidores

## 📞 Suporte

- GitHub Issues
- Email: suporte@riskguardian.ai
- Discord: [RiskGuardian Community](https://discord.gg/riskguardian)

## 🗺️ Roadmap

### Q2 2024
- [ ] Suporte a mais blockchains
- [ ] Análise de protocolos DeFi específicos
- [ ] Interface mobile

### Q3 2024
- [ ] Machine Learning para previsões
- [ ] Integração com mais provedores de IA
- [ ] API pública

### Q4 2024
- [ ] Alertas personalizados
- [ ] Relatórios automatizados
- [ ] Dashboard avançado