# 💻 RiskGuardian AI - Development Guide

**Complete guide for daily development workflow with the Docker-based environment.**

---

## 🚀 **Quick Start for New Developers**

### **Prerequisites**
- [Docker Desktop](https://docs.docker.com/get-docker/) (latest version)
- [Git](https://git-scm.com/downloads)
- Code editor (VS Code recommended)
- Terminal/Command line access

### **Initial Setup (5 minutes)**
```bash
# 1. Clone the repository
git clone https://github.com/uederson-ferreira/riskguardian-ai.git
cd riskguardian-ai

# 2. Run automated setup
./scripts/setup.sh

# 3. Access applications
# Frontend:  http://localhost:3000
# Backend:   http://localhost:8000  
# ElizaOS:   http://localhost:3001/health
```

**That's it!** You now have a complete development environment running.

---

## 🛠️ **Daily Development Workflow**

### **Starting Your Development Session**
```bash
# Start all services
./scripts/start-dev.sh

# Or use docker-compose directly
docker-compose up -d

# Check if everything is running
docker-compose ps
```

### **Stopping Your Development Session**
```bash
# Stop all services
./scripts/stop.sh

# Or use docker-compose directly  
docker-compose down

# Stop and remove volumes (reset all data)
docker-compose down -v
```

### **Viewing Logs**
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f elizaos-agent
docker-compose logs -f anvil

# View logs from last 50 lines
docker-compose logs --tail 50 backend
```

---

## 📁 **Working with Each Service**

### **🌐 Frontend Development (Next.js)**

**📍 Location**: `frontend/src/`

**Key Commands**:
```bash
# Enter frontend container
docker-compose exec frontend sh

# Install new dependencies
docker-compose exec frontend npm install package-name

# Run frontend tests
docker-compose exec frontend npm test

# Build for production
docker-compose exec frontend npm run build
```

**Development Workflow**:
1. Edit files in `frontend/src/pages/` or `frontend/src/components/`
2. Changes auto-reload thanks to Docker volume mounts
3. View changes at http://localhost:3000
4. Browser will automatically refresh on file changes

**Common Tasks**:
```bash
# Add a new React component
mkdir frontend/src/components/RiskDashboard
touch frontend/src/components/RiskDashboard/index.js

# Add new page
touch frontend/src/pages/portfolio.js

# Add styling
touch frontend/src/styles/dashboard.css
```

### **🔧 Backend Development (Node.js)**

**📍 Location**: `backend/src/`

**Key Commands**:
```bash
# Enter backend container
docker-compose exec backend sh

# Install new dependencies
docker-compose exec backend npm install package-name

# Run backend tests
docker-compose exec backend npm test

# Check API health
curl http://localhost:8000/health
```

**Development Workflow**:
1. Edit files in `backend/src/`
2. Nodemon automatically restarts on changes
3. API available at http://localhost:8000
4. Test endpoints with curl or Postman

**Common API Endpoints to Implement**:
```bash
# Health check (already exists)
GET  http://localhost:8000/health

# Risk analysis endpoints (to implement)
POST http://localhost:8000/api/analyze/portfolio
GET  http://localhost:8000/api/risks/summary
POST http://localhost:8000/api/defi/protocols

# User management (to implement) 
POST http://localhost:8000/api/auth/login
GET  http://localhost:8000/api/user/profile
```

**Example API Development**:
```javascript
// backend/src/routes/risks.js
const express = require('express');
const router = express.Router();

router.post('/analyze', async (req, res) => {
  // Risk analysis logic here
  res.json({ 
    riskScore: 0.75,
    analysis: "Portfolio analysis complete",
    recommendations: []
  });
});

module.exports = router;
```

### **🤖 ElizaOS Agent Development (AI)**

**📍 Location**: `elizaos-agent/src/`

**Key Commands**:
```bash
# Enter AI agent container
docker-compose exec elizaos-agent sh

# Check agent health
curl http://localhost:3001/health

# Test AI agent
curl -X POST http://localhost:3001/analyze \
  -H "Content-Type: application/json" \
  -d '{"portfolio": ["ETH", "BTC"]}'
```

**Development Workflow**:
1. Edit AI agents in `elizaos-agent/src/agents/`
2. Configure AI providers in environment variables
3. Test AI responses through API endpoints
4. Monitor AI usage and costs through logs

**AI Provider Configuration**:
```bash
# Primary: OpenAI
OPENAI_API_KEY=sk-your-openai-key

# Backup: Anthropic
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Multi-model: OpenRouter
OPENROUTER_API_KEY=sk-or-your-openrouter-key
```

### **⛓️ Smart Contracts Development (Solidity)**

**📍 Location**: `contracts/src/`

**Key Commands**:
```bash
# Enter contracts container
docker-compose --profile tools up -d contracts
docker-compose exec contracts sh

# Compile contracts
docker-compose exec contracts forge build

# Run contract tests
docker-compose exec contracts forge test

# Deploy to local Anvil
docker-compose exec contracts forge script script/Deploy.s.sol \
  --rpc-url http://anvil:8545 \
  --broadcast
```

**Blockchain Interaction**:
```bash
# Check Anvil status
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545

# Get available accounts
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_accounts","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545

# Check account balance
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_getBalance","params":["0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266","latest"],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545
```

### **🗄️ Database Development**

**PostgreSQL Commands**:
```bash
# Enter PostgreSQL container
docker-compose exec postgres psql -U chromia -d chromia

# Common SQL operations
# \dt                 # List tables
# \d table_name       # Describe table
# SELECT * FROM users; # Query data
```

**Redis Commands**:
```bash
# Enter Redis container
docker-compose exec redis redis-cli

# Common Redis operations  
# KEYS *              # List all keys
# GET key_name        # Get value
# SET key value       # Set value
# FLUSHALL            # Clear all data
```

**Database Admin Interface**:
```bash
# Start PgAdmin (web interface)
docker-compose --profile tools up -d pgadmin

# Access: http://localhost:5050
# Login: admin@riskguardian.ai / admin123
```

---

## 🧪 **Testing & Debugging**

### **Health Checks**
```bash
# Quick connectivity test
./scripts/test-connectivity.sh

# Individual service tests
curl http://localhost:3000    # Frontend
curl http://localhost:8000    # Backend  
curl http://localhost:3001/health    # ElizaOS
curl http://localhost:7740/health    # Chromia
curl http://localhost:8545    # Anvil
```

### **Debugging Containers**
```bash
# Check container status
docker-compose ps

# Enter any container for debugging
docker-compose exec [service-name] sh

# Check container resource usage
docker stats

# Inspect container details
docker inspect riskguardian-ai-[service-name]-1
```

### **Common Debugging Commands**
```bash
# Container not starting?
docker-compose logs [service-name]

# Port conflicts?
lsof -i :3000
lsof -i :8000
lsof -i :8545

# Network issues?
docker network ls
docker network inspect riskguardian-ai_riskguardian-network

# Volume issues?
docker volume ls
docker volume inspect riskguardian-ai_postgres_data
```

### **Performance Monitoring**
```bash
# Real-time container stats
docker stats

# Disk usage
docker system df

# Clean up unused resources
docker system prune

# Remove unused volumes
docker volume prune
```

---

## 🔧 **Environment Configuration**

### **API Keys Setup**
```bash
# Copy template
cp .env.example .env

# Required for AI features
OPENAI_API_KEY=sk-your-openai-key-here

# Required for authentication
JWT_SECRET=your-super-secure-jwt-secret-min-32-characters

# Optional for enhanced features
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
CHAINLINK_API_KEY=your-chainlink-api-key
ETHERSCAN_API_KEY=your-etherscan-api-key
```

### **Development vs Production**
```bash
# Development (default)
NODE_ENV=development
LOG_LEVEL=debug

# Production
NODE_ENV=production  
LOG_LEVEL=info
```

---

## 📊 **Monitoring & Logs**

### **Real-time Monitoring**
```bash
# Watch all services
watch docker-compose ps

# Monitor logs live
docker-compose logs -f --tail 100

# Monitor specific service
docker-compose logs -f backend

# Monitor errors only
docker-compose logs -f | grep ERROR
```

### **Log Management**
```bash
# View recent logs
docker-compose logs --since 1h

# View specific time range
docker-compose logs --since 2023-01-01T00:00:00Z

# Save logs to file
docker-compose logs > development.log

# Clear logs (restart containers)
docker-compose restart
```

---

## 🚀 **Advanced Development Tasks**

### **Adding New Dependencies**
```bash
# Frontend dependencies
docker-compose exec frontend npm install package-name
# Then rebuild: docker-compose build frontend

# Backend dependencies  
docker-compose exec backend npm install package-name
# Then rebuild: docker-compose build backend

# ElizaOS dependencies
docker-compose exec elizaos-agent npm install package-name
# Then rebuild: docker-compose build elizaos-agent
```

### **Database Migrations**
```bash
# PostgreSQL migrations (manual)
docker-compose exec postgres psql -U chromia -d chromia -f /path/to/migration.sql

# Backup database
docker-compose exec postgres pg_dump -U chromia chromia > backup.sql

# Restore database
docker-compose exec postgres psql -U chromia -d chromia < backup.sql
```

### **Smart Contract Deployment**
```bash
# Deploy to local Anvil
docker-compose run --rm contracts forge script script/Deploy.s.sol \
  --rpc-url http://anvil:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Verify deployment
docker-compose run --rm contracts forge script script/Verify.s.sol \
  --rpc-url http://anvil:8545
```

### **Production Deployment**
```bash
# Build production images
docker-compose -f docker-compose.yml build

# Deploy to production
./scripts/deploy.sh

# Start with production profile
docker-compose --profile production up -d
```

---

## 🔥 **Hot Tips for Productivity**

### **IDE Integration**
```bash
# VS Code with Docker extension
# - Install "Docker" extension
# - Install "Remote-Containers" extension  
# - Right-click on container → "Attach Visual Studio Code"
```

### **Useful Aliases**
```bash
# Add to your ~/.bashrc or ~/.zshrc
alias dcu="docker-compose up -d"
alias dcd="docker-compose down"  
alias dcl="docker-compose logs -f"
alias dcp="docker-compose ps"
alias dcr="docker-compose restart"

# RiskGuardian specific
alias rg-start="./scripts/start-dev.sh"
alias rg-stop="./scripts/stop.sh"
alias rg-logs="docker-compose logs -f"
alias rg-test="./scripts/test-connectivity.sh"
```

### **Development Shortcuts**
```bash
# Quick restart of specific service
docker-compose restart backend

# Quick rebuild and restart
docker-compose up -d --build frontend

# Clear everything and start fresh
docker-compose down -v && ./scripts/setup.sh

# Tail logs of multiple services
docker-compose logs -f backend elizaos-agent
```

---

## 🚨 **Common Issues & Solutions**

### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or stop all Docker containers
docker stop $(docker ps -q)
```

### **Container Build Failures**
```bash
# Clear Docker cache and rebuild
docker system prune -a
docker-compose build --no-cache [service-name]
```

### **Volume Permission Issues**
```bash
# Fix volume permissions (Linux/Mac)
sudo chown -R $USER:$USER ./frontend/node_modules
sudo chown -R $USER:$USER ./backend/node_modules
```

### **Anvil Not Accessible**
```bash
# Check if Anvil is running
docker-compose logs anvil

# Test Anvil connectivity
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545

# Restart Anvil if needed
docker-compose restart anvil
```

### **Out of Memory Issues**
```bash
# Check Docker resource limits
docker system df

# Clean up unused containers/images
docker system prune

# Increase Docker memory (Docker Desktop)
# Settings → Resources → Advanced → Memory
```

---

## 📚 **Useful Resources**

### **Documentation Links**
- [Next.js Documentation](https://nextjs.org/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Foundry Book](https://book.getfoundry.sh/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### **API Testing Tools**
- [Postman](https://www.postman.com/) - API testing and development
- [Insomnia](https://insomnia.rest/) - REST and GraphQL client
- [curl](https://curl.se/) - Command line HTTP client

### **Blockchain Tools**
- [Remix IDE](https://remix.ethereum.org/) - Online Solidity IDE
- [Etherscan](https://etherscan.io/) - Ethereum blockchain explorer
- [OpenZeppelin](https://openzeppelin.com/contracts/) - Secure smart contract library

---

## 🎯 **Development Best Practices**

### **Code Organization**
- Keep components small and focused
- Use consistent naming conventions
- Comment complex business logic
- Write tests for critical functions

### **Git Workflow**
```bash
# Create feature branch
git checkout -b feature/portfolio-analysis

# Make your changes
# ...

# Test your changes
./scripts/test-connectivity.sh

# Commit with descriptive message
git add .
git commit -m "feat: add portfolio risk analysis endpoint"

# Push and create pull request
git push origin feature/portfolio-analysis
```

### **Security Practices**
- Never commit API keys or secrets
- Use environment variables for configuration
- Validate all user inputs
- Implement proper error handling

### **Performance Optimization**
- Use Redis for caching API responses
- Optimize database queries
- Implement pagination for large datasets
- Monitor container resource usage

---

## 🚀 **Ready to Develop!**

You now have everything you need to start developing on RiskGuardian AI. The environment is:

- ✅ **Fully Dockerized** - Consistent across all machines
- ✅ **Hot Reload Enabled** - Instant feedback on changes
- ✅ **Properly Networked** - All services can communicate
- ✅ **Health Monitored** - Easy debugging and troubleshooting
- ✅ **Production Ready** - Deploy with confidence

**Happy coding! 🎉**

---

**Need help?** Open an issue on GitHub or check the troubleshooting section above.