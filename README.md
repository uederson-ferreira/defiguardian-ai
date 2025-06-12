# 🚀 RiskGuardian AI

**AI-powered DeFi Risk Analysis Platform**

A comprehensive blockchain risk analysis platform built with Next.js, Node.js, ElizaOS AI agents, and multi-chain support.

## 🎯 Features

- 🤖 **AI Risk Analysis** - ElizaOS-powered intelligent risk assessment
- ⛓️ **Multi-Blockchain** - Ethereum, Chromia, and more
- 📊 **Real-time Dashboard** - Interactive risk visualization
- 🔗 **Smart Contracts** - On-chain risk management protocols
- 🏗️ **Microservices** - Scalable Docker-based architecture

## 🚀 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (latest version)
- [Docker Compose](https://docs.docker.com/compose/install/) (latest version)
- Git

### Setup (5 minutes)

```bash
# 1. Clone repository
git clone https://github.com/uederson-ferreira/riskguardian-ai.git
cd riskguardian-ai

# 2. Setup environment
./scripts/setup.sh

# 3. Access applications
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000
# ElizaOS:   http://localhost:3001
```

That's it! 🎉

## 🔧 Configuration

### Required API Keys

Copy `.env.example` to `.env` and fill in:

```bash
# AI Services (Required)
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Authentication (Required)  
JWT_SECRET=your-secure-jwt-secret-min-32-chars

# Optional: Advanced features
CHAINLINK_API_KEY=your-chainlink-key
ETHERSCAN_API_KEY=your-etherscan-key
```

## 🏗️ Architecture

```
┌─────────────────┬─────────────────┬─────────────────┐
│   Frontend      │   Backend       │   ElizaOS       │
│   (Next.js)     │   (Node.js)     │   (AI Agent)    │
│   Port: 3000    │   Port: 8000    │   Port: 3001    │
└─────────────────┴─────────────────┴─────────────────┘
                           │
┌─────────────────┬─────────────────┬─────────────────┐
│   PostgreSQL    │   Redis         │   Anvil         │
│   (Database)    │   (Cache)       │   (Blockchain)  │
│   Port: 5432    │   Port: 6379    │   Port: 8545    │
└─────────────────┴─────────────────┴─────────────────┘
                           │
                  ┌─────────────────┐
                  │   Chromia       │
                  │   (Database)    │
                  │   Port: 7740    │
                  └─────────────────┘
```

## 🛠️ Development

### Daily Commands

```bash
# Start development environment
./scripts/start-dev.sh

# Stop all services
./scripts/stop.sh

# View logs
docker-compose logs -f [service-name]

# Restart specific service
docker-compose restart [service-name]
```

### Project Structure

```
riskguardian-ai/
├── frontend/          # Next.js React application
├── backend/           # Node.js REST API
├── elizaos-agent/     # AI risk analysis agent
├── contracts/         # Smart contracts (Solidity)
├── chromia/           # Chromia blockchain integration
├── scripts/           # Automation scripts
└── docker-compose.yml # Service orchestration
```

### Available Services

| Service | URL | Description |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | React dashboard |
| Backend API | http://localhost:8000 | REST API endpoints |
| ElizaOS Agent | http://localhost:3001 | AI risk analysis |
| Chromia | http://localhost:7740 | Database API |
| Anvil | http://localhost:8545 | Local blockchain |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Cache layer |

## 🧪 Testing

```bash
# Test all services connectivity
./scripts/test-connectivity.sh

# Test blockchain
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545

# Test backend API  
curl http://localhost:8000

# Test frontend
curl http://localhost:3000
```

## 🚀 Deployment

### Development
```bash
./scripts/start-dev.sh
```

### Production
```bash
./scripts/deploy.sh
```

### Docker Tools (Optional)
```bash
# Database admin interface
docker-compose --profile tools up -d pgadmin
# Access: http://localhost:5050

# Smart contracts development
docker-compose --profile tools up -d contracts
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** changes: `git commit -m 'Add amazing feature'`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** Pull Request

### Development Workflow

```bash
# Setup development environment
./scripts/setup.sh

# Make your changes in:
# - frontend/src/     (React components)
# - backend/src/      (API endpoints)  
# - elizaos-agent/src/ (AI agents)
# - contracts/src/    (Smart contracts)

# Test your changes
./scripts/test-connectivity.sh

# Commit and push
git add .
git commit -m "feat: your awesome feature"
git push
```

## 📋 Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check if ports are in use
lsof -i :3000,:8000,:8545

# Stop conflicting services
docker-compose down
```

**Anvil connection issues:**
```bash
# Check Anvil logs
docker-compose logs anvil

# Restart Anvil
docker-compose restart anvil
```

**Database connection issues:**
```bash
# Check PostgreSQL
docker-compose exec postgres pg_isready -U chromia

# Reset database
docker-compose down -v
./scripts/setup.sh
```

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | ✅ | OpenAI API for AI features |
| `JWT_SECRET` | ✅ | Authentication secret (32+ chars) |
| `ANTHROPIC_API_KEY` | ⚠️ | Anthropic Claude API (backup) |
| `CHAINLINK_API_KEY` | ❌ | Chainlink integration |
| `ETHERSCAN_API_KEY` | ❌ | Ethereum network data |

## 📊 Monitoring

```bash
# Service status
docker-compose ps

# Live logs
docker-compose logs -f

# Resource usage
docker stats

# System health
./scripts/test-connectivity.sh
```

## 📚 API Documentation

### Backend Endpoints

- `GET /` - Service health check
- `GET /api/risks` - Get risk analysis data
- `POST /api/portfolio/analyze` - Analyze portfolio risk
- `GET /api/health` - System health status

### ElizaOS Agent Endpoints

- `GET /health` - Agent health check
- `POST /analyze` - Risk analysis request
- `GET /status` - Analysis status

## 🏆 Tech Stack

- **Frontend**: Next.js, React, TypeScript
- **Backend**: Node.js, Express, PostgreSQL
- **AI**: ElizaOS, OpenAI, Anthropic
- **Blockchain**: Anvil (Foundry), Chromia
- **Cache**: Redis
- **Deployment**: Docker, Docker Compose
- **Smart Contracts**: Solidity, Foundry

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙋‍♂️ Support

- 📧 **Email**: support@riskguardian.ai
- 🐛 **Issues**: [GitHub Issues](https://github.com/uederson-ferreira/riskguardian-ai/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/uederson-ferreira/riskguardian-ai/discussions)

---

**Built with ❤️ by the RiskGuardian team**