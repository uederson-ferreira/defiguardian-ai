# RiskGuardian AI - Documentação

## 📚 Visão Geral

RiskGuardian AI é uma plataforma de gerenciamento de riscos baseada em blockchain que utiliza inteligência artificial para análise e mitigação de riscos em contratos inteligentes.

## 🏗️ Arquitetura

O projeto é composto por vários microserviços:

### Frontend (Next.js)

- Interface web moderna e responsiva
- Integração com Web3
- Dashboard de análise de riscos
- Chat interativo com ElizaOS

### Backend (Node.js)

- API RESTful
- Integração com blockchain
- Gerenciamento de usuários
- Processamento de dados

### ElizaOS Agent (Node.js)

- Agente de IA para análise de riscos
- Processamento de linguagem natural
- Integração com modelos de ML
- Chat em tempo real

### Smart Contracts (Solidity)

- Contratos de gerenciamento de riscos
- Integração com Chainlink
- Oráculos personalizados
- Sistema de governança

### Chromia Node

- Blockchain privada para dados sensíveis
- Armazenamento descentralizado
- Smart contracts em Rell

## 🚀 Começando

### Pré-requisitos

- Docker e Docker Compose
- Node.js 20+
- Git
- Make (opcional)

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/riskguardian-ai/riskguardian-ai.git
cd riskguardian-ai
```

## 2. Configure o ambiente

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

## 3. Inicie o ambiente de desenvolvimento

```bash
./scripts/setup.sh
```

### Desenvolvimento

Para iniciar o ambiente de desenvolvimento:

```bash
./scripts/start-dev.sh
```

Para parar o ambiente:

```bash
./scripts/stop.sh
```

### Deploy

Para fazer deploy em produção:

```bash
./scripts/deploy.sh
```

## 🛠️ Ferramentas de Desenvolvimento

### Admin Tools

- PgAdmin: <http://localhost:5050>
- Redis Commander: <http://localhost:8081>

### Endpoints de Desenvolvimento

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- ElizaOS: <http://localhost:3001>
- Chromia: <http://localhost:7740>
- Anvil: <http://localhost:8545>

## 📝 Documentação Adicional

- [Guia de Contribuição](CONTRIBUTING.md)
- [Arquitetura Detalhada](ARCHITECTURE.md)
- [Guia de API](API.md)
- [Smart Contracts](SMART_CONTRACTS.md)
- [Segurança](SECURITY.md)

## 🤝 Contribuindo

Por favor, leia o [Guia de Contribuição](CONTRIBUTING.md) para detalhes sobre nosso código de conduta e o processo para enviar pull requests.

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Suporte

Para suporte, envie um email para <support@riskguardian.ai> ou abra uma issue no GitHub.
