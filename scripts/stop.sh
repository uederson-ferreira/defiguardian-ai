#!/bin/bash

echo "🛑 Stopping RiskGuardian AI Environment"

# Colors for better visualization
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi

# Show current status before stopping
echo -e "\n${YELLOW}📊 Current container status:${NC}"
if docker-compose ps --format "table {{.Name}}\t{{.Status}}" 2>/dev/null | grep -q "Up"; then
    docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
else
    echo -e "${YELLOW}   No containers are currently running${NC}"
    echo -e "\n${GREEN}✅ Environment is already stopped${NC}"
    exit 0
fi

# Show resource usage before stopping
echo -e "\n${YELLOW}💻 Current resource usage:${NC}"
running_containers=$(docker-compose ps -q 2>/dev/null)
if [ ! -z "$running_containers" ]; then
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" $running_containers 2>/dev/null | head -8
fi

# Stop all services
echo -e "\n${YELLOW}⏹️  Stopping all containers...${NC}"
docker-compose down

# Check if stop was successful
if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}✅ All services stopped successfully${NC}"
else
    echo -e "\n${RED}⚠️  Some services may still be running${NC}"
    echo -e "   Run ${YELLOW}docker-compose ps${NC} to check status"
fi

# Show preserved data
echo ""
echo -e "${BLUE}💾 Data preserved in volumes:${NC}"
echo "  - PostgreSQL database: postgres_data"
echo "  - Chromia database: chromia_data"
echo "  - Redis cache: redis_data"
echo "  - Smart contracts: contracts_cache, contracts_out"

# Show freed resources
echo ""
echo -e "${BLUE}🔧 Next steps:${NC}"
echo "  Restart:      ./scripts/start-dev.sh"
echo "  Check status: docker-compose ps"
echo "  View logs:    docker-compose logs [service-name]"

# Optional data cleanup
echo ""
echo -e "${YELLOW}🗑️  Data cleanup options:${NC}"
echo "  Remove all data:     docker-compose down -v"
echo "  Clean unused images: docker image prune"
echo "  Clean everything:    docker system prune"

# Interactive cleanup option
echo ""
read -p "Remove all project data volumes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}🗑️  Removing all data volumes...${NC}"
    docker-compose down -v
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All data volumes removed${NC}"
        echo -e "${YELLOW}⚠️  You'll need to run ./scripts/setup.sh next time${NC}"
    else
        echo -e "${RED}❌ Failed to remove some volumes${NC}"
    fi
fi

# Final status
echo ""
echo -e "${GREEN}🏁 RiskGuardian AI environment stopped${NC}"

# Show disk space freed (if available)
if command -v df > /dev/null 2>&1; then
    available_space=$(df -h . | awk 'NR==2 {print $4}')
    echo -e "${BLUE}💾 Available disk space: ${available_space}${NC}"
fi