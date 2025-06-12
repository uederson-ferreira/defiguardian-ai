#!/bin/bash

echo "🚀 Setting up RiskGuardian AI Development Environment"
echo "Architecture: PostgreSQL → Chromia → Backend → Frontend + ElizaOS"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo -e "${GREEN}📄 Created .env file from template${NC}"
    echo -e "${YELLOW}⚠️  Please edit .env file with your API keys before continuing${NC}"
    echo ""
    echo "Required API keys:"
    echo "  - OPENAI_API_KEY (Primary AI - get from https://platform.openai.com/)"
    echo "  - JWT_SECRET (already set with development key)"
    echo ""
    echo "Optional API keys:"  
    echo "  - OPENROUTER_API_KEY (Multi-model AI - get from https://openrouter.ai/)"
    echo "  - ANTHROPIC_API_KEY (Claude AI - get from https://console.anthropic.com/)"
    echo "  - CHAINLINK_API_KEY (DeFi integration - get from https://chain.link/developers)"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

# Check required environment variables
echo -e "\n${YELLOW}🔍 Checking environment variables...${NC}"

if ! grep -q "OPENAI_API_KEY=sk-" .env && ! grep -q "OPENROUTER_API_KEY=sk-or-" .env; then
    echo -e "${YELLOW}⚠️  No AI API keys set. You can use placeholders for initial testing${NC}"
    echo "  - OPENAI_API_KEY (get from https://platform.openai.com/)"
    echo "  - OPENROUTER_API_KEY (get from https://openrouter.ai/ - optional)"
fi

if ! grep -q "JWT_SECRET=" .env; then
    echo -e "${RED}❌ Missing JWT_SECRET in .env file${NC}"
    echo "This should be auto-generated, please check your .env file"
    exit 1
fi

# Create necessary directories
echo -e "\n${YELLOW}📁 Creating project directories...${NC}"
mkdir -p {frontend,backend,elizaos-agent,contracts,chromia}/{src,config}
mkdir -p ssl logs scripts
mkdir -p chromia/{database/init,mock}

# Create Chromia mock files (ensure they exist)
echo -e "\n${YELLOW}🔗 Setting up Chromia mock...${NC}"
if [ ! -f chromia/mock/health ]; then
    echo '{"status":"ok","service":"chromia-mock","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}' > chromia/mock/health
fi

if [ ! -f chromia/mock/index.html ]; then
    cat > chromia/mock/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Chromia Mock Service</title></head>
<body>
    <h1>🔗 Chromia Mock Service</h1>
    <p>Status: <strong>Running</strong></p>
    <p>This is a temporary mock service while we implement the real Chromia node.</p>
    <ul><li><a href="/health">Health Check</a></li></ul>
</body>
</html>
EOF
fi

# Set executable permissions
chmod +x scripts/*.sh
chmod +x chromia/*.sh 2>/dev/null || true

# Build and start development environment
echo -e "\n${YELLOW}🐳 Building Docker containers...${NC}"
echo "This will start: PostgreSQL → Chromia → Redis → Anvil → Backend → Frontend → ElizaOS"
docker-compose build

echo -e "\n${YELLOW}🚀 Starting development environment...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services to start...${NC}"
echo "PostgreSQL starting first (needed for Chromia)..."
sleep 15

echo "Checking PostgreSQL connection..."
if docker-compose exec -T postgres pg_isready -U chromia > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL might still be starting up${NC}"
fi

echo "Waiting for all services to initialize..."
sleep 30

echo -e "\n${YELLOW}🔍 Checking service connectivity...${NC}"

# Check Chromia Mock
if curl -f http://localhost:7740/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Chromia mock is running${NC}"
else
    echo -e "${YELLOW}⚠️  Chromia mock might still be starting up${NC}"
fi

# Check Anvil blockchain (CRITICAL!)
if curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Anvil blockchain is running${NC}"
else
    echo -e "${YELLOW}⚠️  Anvil might still be starting up (check logs: docker-compose logs anvil)${NC}"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis cache is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis might still be starting up${NC}"
fi

# Final status check
echo -e "\n${YELLOW}📊 Final service status:${NC}"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Show summary
echo ""
echo -e "${GREEN}✅ Development environment is ready!${NC}"
echo ""
echo -e "${YELLOW}🏗️ Architecture Overview:${NC}"
echo "  PostgreSQL (5432) → Backend storage for Chromia"
echo "  Chromia (7740)    → Mock API (will be replaced with real Chromia)"
echo "  Redis (6379)      → Cache layer for sessions"
echo "  Anvil (8545)      → Local Ethereum blockchain"
echo "  Backend (8000)    → Node.js API server"
echo "  Frontend (3000)   → Next.js application"
echo "  ElizaOS (3001)    → AI Agent service"
echo ""
echo -e "${GREEN}🌐 Access points:${NC}"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8000"
echo "  ElizaOS:      http://localhost:3001/health"
echo "  Chromia:      http://localhost:7740"
echo "  Anvil:        http://localhost:8545"
echo "  PostgreSQL:   localhost:5432"
echo "  Redis:        localhost:6379"
echo ""
echo -e "${YELLOW}🛠️ Admin tools (optional):${NC}"
echo "  docker-compose --profile tools up -d"
echo "  PgAdmin:      http://localhost:5050 (admin@riskguardian.ai / admin123)"
echo ""
echo -e "${YELLOW}🧪 Quick tests:${NC}"
echo "  curl http://localhost:8545  # Test Anvil blockchain"
echo "  curl http://localhost:8000  # Test Backend API"
echo "  curl http://localhost:3000  # Test Frontend"
echo ""
echo -e "${YELLOW}🔧 Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f [service]"
echo "  Stop all:     ./scripts/stop.sh"
echo "  Restart:      ./scripts/start-dev.sh"
echo "  Test all:     ./scripts/test-connectivity.sh"
echo "  DB Admin:     docker-compose --profile tools up -d"

# Check if any services failed
echo -e "\n${YELLOW}🔍 Checking for any failed services...${NC}"
FAILED_SERVICES=$(docker-compose ps --filter "status=unhealthy" --format "{{.Name}}")
if [ ! -z "$FAILED_SERVICES" ]; then
    echo -e "${YELLOW}⚠️  Some services are unhealthy:${NC}"
    echo "$FAILED_SERVICES"
    echo "Run 'docker-compose logs [service-name]' to debug"
else
    echo -e "${GREEN}✅ All services are running properly!${NC}"
fi

echo -e "\n${GREEN}🚀 Ready to start developing! Happy coding!${NC}"