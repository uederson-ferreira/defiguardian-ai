#!/bin/bash

echo "🚀 Starting RiskGuardian AI Development Environment"

# Colors for better visualization
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found. Run ./scripts/setup.sh first${NC}"
    exit 1
fi

# Start core services
echo -e "\n${YELLOW}🐳 Starting containers...${NC}"
docker-compose up -d

# Smart health check instead of fixed sleep
echo -e "\n${YELLOW}⏳ Waiting for services to be healthy...${NC}"
timeout=60
healthy_services=0

while [ $timeout -gt 0 ]; do
    # Count healthy services (those with health checks)
    healthy_services=$(docker-compose ps --filter "health=healthy" --format "{{.Name}}" 2>/dev/null | wc -l)
    
    # Check if core services are up (even if not all have health checks)
    total_running=$(docker-compose ps --filter "status=running" --format "{{.Name}}" | wc -l)
    
    if [ $healthy_services -ge 3 ] && [ $total_running -ge 6 ]; then
        echo -e "${GREEN}✅ Services are initializing successfully!${NC}"
        break
    fi
    
    sleep 2
    timeout=$((timeout-2))
    
    if [ $((60-timeout)) -eq 30 ]; then
        echo -e "${YELLOW}   Still waiting... (some services take longer to start)${NC}"
    fi
done

# Show container status
echo -e "\n${YELLOW}📊 Container status:${NC}"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

# Test critical services connectivity
echo -e "\n${YELLOW}🔍 Testing service connectivity...${NC}"

# Test Anvil (critical blockchain service)
echo -n "   Anvil Blockchain: "
if curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Responsive${NC}"
else
    echo -e "${YELLOW}⚠️  Still starting up${NC}"
fi

# Test Frontend
echo -n "   Frontend: "
if curl -s -f http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Responsive${NC}"
else
    echo -e "${YELLOW}⚠️  Still starting up${NC}"
fi

# Test Backend
echo -n "   Backend API: "
if curl -s -f http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Responsive${NC}"
else
    echo -e "${YELLOW}⚠️  Still starting up${NC}"
fi

# Test Chromia Mock
echo -n "   Chromia Mock: "
if curl -s -f http://localhost:7740/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Responsive${NC}"
else
    echo -e "${YELLOW}⚠️  Still starting up${NC}"
fi

echo ""
echo -e "${GREEN}✅ Development environment started!${NC}"
echo ""
echo -e "${BLUE}🌐 Access points:${NC}"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8000" 
echo "  ElizaOS:      http://localhost:3001/health"
echo "  Chromia:      http://localhost:7740"
echo "  Anvil RPC:    http://localhost:8545"
echo "  PostgreSQL:   localhost:5432"
echo "  Redis:        localhost:6379"
echo ""
echo -e "${BLUE}🛠️ Useful commands:${NC}"
echo "  View logs:    docker-compose logs -f [service-name]"
echo "  Restart:      docker-compose restart [service-name]"
echo "  Stop all:     ./scripts/stop.sh"
echo "  Service status: docker-compose ps"
echo ""

# Check for any unhealthy services
unhealthy=$(docker-compose ps --filter "health=unhealthy" --format "{{.Name}}" 2>/dev/null)
if [ ! -z "$unhealthy" ]; then
    echo -e "${YELLOW}⚠️  Some services are unhealthy:${NC}"
    echo "$unhealthy"
    echo -e "   Run ${YELLOW}docker-compose logs [service-name]${NC} to debug"
    echo ""
fi

# Optional: Show logs
read -p "Show live logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "\n${YELLOW}📝 Starting live logs (Ctrl+C to stop):${NC}"
    sleep 1
    docker-compose logs -f
fi