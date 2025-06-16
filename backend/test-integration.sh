#!/bin/bash

echo "🧪 RiskGuardian API Integration Test"
echo "===================================="

BASE_URL="http://localhost:8001"
TEST_ADDRESS="0x742d35Cc6634C0532925a3b844Bc454e4438f44e"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

success_count=0
total_tests=0

test_endpoint() {
    local name="$1"
    local url="$2"
    local method="${3:-GET}"
    local data="$4"
    local auth_header="$5"
    
    total_tests=$((total_tests + 1))
    echo -n "Testing $name... "
    
    if [[ "$method" == "POST" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$url" \
            -H "Content-Type: application/json" \
            ${auth_header:+-H "$auth_header"} \
            ${data:+-d "$data"})
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            ${auth_header:+-H "$auth_header"})
    fi
    
    http_code=$(echo "$response" | awk 'END{print}')
    body=$(echo "$response" | sed '$d')
    
    if [[ "$http_code" =~ ^[23] ]]; then
        echo -e "${GREEN}✅ PASS (${http_code})${NC}"
        success_count=$((success_count + 1))
        echo "   Response: $body"
        return 0
    else
        echo -e "${RED}❌ FAIL (${http_code})${NC}"
        echo "   Response: $body"
        return 1
    fi
}

echo "🏥 Basic Health Checks"
echo "======================"
test_endpoint "Server Health" "$BASE_URL/health"

echo ""
echo "🔐 Authentication Flow"
echo "======================"

# Request nonce
echo -n "Testing Nonce Request... "
nonce_response=$(curl -s -X POST "$BASE_URL/api/auth/nonce" \
    -H "Content-Type: application/json" \
    -d "{\"address\":\"$TEST_ADDRESS\"}")

if echo "$nonce_response" | grep -q "nonce"; then
    echo -e "${GREEN}✅ PASS${NC}"
    echo "   Response: $nonce_response"
    success_count=$((success_count + 1))
    
    # Extract nonce and message for signing
    NONCE=$(echo "$nonce_response" | grep -o '"nonce":"[^"]*"' | cut -d'"' -f4)
    MESSAGE=$(echo "$nonce_response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4)
    
    echo "\nℹ️  Retrieved nonce: $NONCE"
    echo "ℹ️  Message to sign: $MESSAGE"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Response: $nonce_response"
fi
total_tests=$((total_tests + 1))

echo ""
echo "📊 Test Summary"
echo "==============="
echo "Total Tests: $total_tests"
echo "Passed: $success_count"
echo "Failed: $((total_tests - success_count))"

if [[ "$success_count" -eq "$total_tests" ]]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Some tests failed${NC}"
    exit 1
fi