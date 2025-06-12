#!/bin/bash

echo "🔍 Testing RiskGuardian AI Blockchain Connectivity"
echo "================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test Anvil external connectivity
echo -e "\n${YELLOW}📡 Testing Anvil external connectivity...${NC}"
if curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://localhost:8545 > /dev/null; then
  echo -e "${GREEN}✅ Anvil is accessible from host${NC}"
  
  # Get block number
  BLOCK=$(curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
    http://localhost:8545 | jq -r '.result')
  echo -e "   Current block: ${BLOCK}"
else
  echo -e "${RED}❌ Anvil connection failed from host${NC}"
fi

# Test Anvil from backend container
echo -e "\n${YELLOW}🐳 Testing Anvil from backend container...${NC}"
if docker-compose exec -T backend curl -s -X POST \
  -H "Content-Type: application/json" \
  -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
  http://anvil:8545 > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Anvil is accessible from backend container${NC}"
else
  echo -e "${RED}❌ Anvil connection failed from backend container${NC}"
fi

# Test Chromia
echo -e "\n${YELLOW}🔗 Testing Chromia connectivity...${NC}"
if curl -s -f http://localhost:7740/health > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Chromia is accessible${NC}"
else
  echo -e "${RED}❌ Chromia connection failed${NC}"
fi

# Test Redis
echo -e "\n${YELLOW}📦 Testing Redis connectivity...${NC}"
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
  echo -e "${GREEN}✅ Redis is accessible${NC}"
else
  echo -e "${RED}❌ Redis connection failed${NC}"
fi

# Test smart contract deployment
echo -e "\n${YELLOW}⛓️ Testing smart contract deployment...${NC}"
if [ -d "./contracts" ]; then
  echo "Attempting contract deployment..."
  if docker-compose run --rm contracts forge script script/Deploy.s.sol \
    --rpc-url http://anvil:8545 \
    --broadcast \
    --silent 2>/dev/null; then
    echo -e "${GREEN}✅ Smart contracts deployed successfully${NC}"
  else
    echo -e "${RED}❌ Smart contract deployment failed${NC}"
    echo "This might be normal if contracts don't exist yet"
  fi
else
  echo -e "${YELLOW}⚠️ Contracts directory not found - skipping deployment test${NC}"
fi

# Show service status
echo -e "\n${YELLOW}📊 Service Status:${NC}"
docker-compose ps --format "table {{.Name}}\t{{.State}}\t{{.Ports}}"

# Network information
echo -e "\n${YELLOW}🌐 Network Information:${NC}"
echo "Frontend:     http://localhost:3000"
echo "Backend API:  http://localhost:8000"
echo "ElizaOS:      http://localhost:3001"
echo "Chromia:      http://localhost:7740"
echo "Redis:        localhost:6379"
echo "Anvil:        http://localhost:8545"

# Show Anvil accounts
echo -e "\n${YELLOW}💰 Anvil Accounts (for testing):${NC}"
echo "Account 0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo "Account 1: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
echo "Private Key 0: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"

echo -e "\n${GREEN}🚀 Blockchain connectivity test completed!${NC}"