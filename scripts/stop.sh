#!/bin/bash

echo "🛑 Stopping RiskGuardian AI Environment"

# Stop all services
echo "⏹️  Stopping all containers..."
docker-compose down

echo "✅ All services stopped"
echo ""
echo "💾 Data preserved in volumes:"
echo "  - Chromia database: chromia_data"
echo "  - Redis cache: redis_data"
echo "  - Smart contracts: contracts_cache, contracts_out"
echo ""
echo "🔧 To restart: ./scripts/start-dev.sh"
echo "🗑️  To remove all data: docker-compose down -v"