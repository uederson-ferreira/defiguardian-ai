# ��️ RiskGuardian AI

Sistema inteligente de análise de risco para portfólios DeFi, utilizando múltiplos modelos de IA.

## 🎯 Visão Geral

O RiskGuardian AI é uma plataforma avançada que utiliza inteligência artificial para analisar portfólios DeFi e fornecer insights valiosos sobre riscos e oportunidades. O sistema combina o poder do GPT-4 e Claude para oferecer análises precisas e recomendações personalizadas.

## ✨ Funcionalidades Principais

### 🔍 Análise de Portfólio
- Avaliação em tempo real de posições DeFi
- Cálculo de métricas de risco (fator de saúde, razão de colateral)
- Detecção de exposição excessiva
- Análise de diversificação

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

### 🤖 IA Multimodelo
- GPT-4 para análise principal
- Claude para validação e análises complexas
- Sistema de fallback automático
- Contexto persistente de conversas

## 🛠️ Tecnologias

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
# Backend
cd elizaos-agent
npm install

# Frontend
cd ../frontend
npm install
```

3. Configure o ambiente:
```bash
# Backend
cp .env.example .env-dev
# Edite .env-dev com suas configurações

# Frontend
cp .env.local.example .env.local
# Edite .env.local com suas configurações
```

4. Inicie os serviços:
```bash
# Backend
cd elizaos-agent
npm run dev

# Frontend
cd ../frontend
npm run dev
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

#### 3. Updates de Mercado
```javascript
ws.send(JSON.stringify({
  type: 'market_update',
  content: {
    // Dados de mercado
  }
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

#### 2. Histórico
```javascript
{
  type: 'history_result',
  content: [
    'Usuário: Analise meu portfólio',
    'IA: Seu portfólio atual...'
  ]
}
```

#### 3. Erro
```javascript
{
  type: 'error',
  content: 'Mensagem de erro'
}
```

## 🔒 Segurança

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

# Cache
CACHE_TTL=5
CACHE_CHECK_PERIOD=1

# Segurança
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
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