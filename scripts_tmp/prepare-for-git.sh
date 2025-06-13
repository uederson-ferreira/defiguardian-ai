#!/bin/bash

echo "🔧 Finalizando Setup para Git e Colaboração"
echo "============================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "\n${YELLOW}📁 Criando estruturas de projeto...${NC}"

# Criar estruturas básicas
mkdir -p frontend/src/{pages,components,hooks,utils,styles}
mkdir -p frontend/public/{images,icons}
mkdir -p backend/src/{routes,controllers,services,models,middleware,utils}
mkdir -p backend/tests
mkdir -p elizaos-agent/src/{agents,services,handlers,utils}
mkdir -p contracts/src contracts/script contracts/test
mkdir -p chromia/src/{models,queries}
mkdir -p docs

echo -e "\n${YELLOW}📦 Criando package.json files...${NC}"

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "riskguardian-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0"
  },
  "devDependencies": {
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  }
}
EOF

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "riskguardian-backend",
  "version": "0.1.0",
  "description": "RiskGuardian AI Backend API",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "build": "echo 'Build complete'",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0",
    "jest": "^29.0.0"
  }
}
EOF

# ElizaOS package.json
cat > elizaos-agent/package.json << 'EOF'
{
  "name": "riskguardian-elizaos",
  "version": "0.1.0",
  "description": "RiskGuardian AI ElizaOS Agent",
  "main": "src/index.js",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "build": "echo 'Build complete'"
  },
  "dependencies": {
    "express": "^4.18.0",
    "ws": "^8.0.0",
    "axios": "^1.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.0"
  }
}
EOF

echo -e "\n${YELLOW}📝 Criando arquivos básicos...${NC}"

# Frontend index page
cat > frontend/src/pages/index.js << 'EOF'
export default function Home() {
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>🚀 RiskGuardian AI</h1>
      <p>AI-powered DeFi Risk Analysis Platform</p>
      <div style={{ marginTop: '2rem' }}>
        <h2>🎯 Features Coming Soon:</h2>
        <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
          <li>🤖 AI Risk Analysis</li>
          <li>📊 Portfolio Dashboard</li>
          <li>⛓️ Multi-chain Support</li>
          <li>🔗 Smart Contracts</li>
        </ul>
      </div>
      <div style={{ marginTop: '2rem', fontSize: '0.9rem', color: '#666' }}>
        <p>Backend API: <a href="http://localhost:8000">localhost:8000</a></p>
        <p>ElizaOS Agent: <a href="http://localhost:3001/health">localhost:3001/health</a></p>
      </div>
    </div>
  );
}
EOF

# Backend index
cat > backend/src/index.js << 'EOF'
const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 8000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({
    message: "RiskGuardian AI Backend",
    version: "0.1.0",
    status: "running",
    endpoints: {
      health: "/health",
      api: "/api/*"
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/status', (req, res) => {
  res.json({
    service: "riskguardian-backend",
    version: "0.1.0",
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 RiskGuardian Backend running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
});
EOF

# ElizaOS index
cat > elizaos-agent/src/index.js << 'EOF'
const express = require('express');
const app = express();

const PORT = process.env.PORT || 3001;

app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: "ok",
    service: "elizaos-agent",
    version: "0.1.0",
    ai_models: {
      primary: process.env.AI_PROVIDER || "openai",
      available: ["openai", "anthropic", "openrouter"]
    }
  });
});

app.get('/status', (req, res) => {
  res.json({
    agent_status: "ready",
    capabilities: [
      "risk-analysis",
      "portfolio-assessment", 
      "defi-monitoring"
    ],
    timestamp: new Date().toISOString()
  });
});

app.post('/analyze', (req, res) => {
  res.json({
    message: "Risk analysis endpoint - Coming soon!",
    input: req.body,
    status: "not_implemented"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🤖 ElizaOS Agent running on port ${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});
EOF

# Contracts foundry.toml
cat > contracts/foundry.toml << 'EOF'
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
remappings = []

[rpc_endpoints]
anvil = "http://localhost:8545"

[etherscan]
mainnet = { key = "${ETHERSCAN_API_KEY}" }
EOF

# Contracts basic contract
mkdir -p contracts/src
cat > contracts/src/RiskGuardian.sol << 'EOF'
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract RiskGuardian {
    string public name = "RiskGuardian";
    string public version = "0.1.0";
    
    event RiskAssessment(
        address indexed user,
        uint256 riskScore,
        uint256 timestamp
    );
    
    function assessRisk(uint256 _riskScore) external {
        emit RiskAssessment(msg.sender, _riskScore, block.timestamp);
    }
    
    function getContractInfo() external view returns (string memory, string memory) {
        return (name, version);
    }
}
EOF

echo -e "\n${YELLOW}📄 Criando documentação adicional...${NC}"

# CONTRIBUTING.md
cat > CONTRIBUTING.md << 'EOF'
# Contributing to RiskGuardian AI

Thank you for your interest in contributing! 🎉

## Development Setup

1. **Fork and clone the repository**
2. **Run setup**: `./scripts/setup.sh`
3. **Start development**: `./scripts/start-dev.sh`

## Development Workflow

- `frontend/src/` - React components and pages
- `backend/src/` - API routes and controllers
- `elizaos-agent/src/` - AI agents and services
- `contracts/src/` - Smart contracts

## Testing

```bash
# Test all services
./scripts/test-connectivity.sh

# Test specific service
docker-compose logs [service-name]
```

## Pull Request Process

1. Create feature branch: `git checkout -b feature/awesome-feature`
2. Make your changes
3. Test thoroughly
4. Commit with clear message
5. Push and create PR

## Questions?

Open an issue or start a discussion!
EOF

# LICENSE
cat > LICENSE << 'EOF'
MIT License

Copyright (c) 2025 RiskGuardian AI

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF

echo -e "\n${GREEN}✅ Setup para Git concluído!${NC}"
echo -e "\n${YELLOW}🔧 Próximos passos:${NC}"
echo "1. git init"
echo "2. git add ."
echo "3. git commit -m '🚀 Initial setup: RiskGuardian AI'"
echo "4. git remote add origin YOUR_REPO_URL"
echo "5. git push -u origin main"

echo -e "\n${GREEN}🤝 Projeto pronto para colaboração!${NC}"