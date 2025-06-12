#!/bin/bash

echo "🚀 Deploying RiskGuardian AI to Production"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Please create it from .env.example"
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Build production images
echo "🏗️ Building production images..."
docker-compose -f docker-compose.yml build

# Stop current services
echo "🛑 Stopping current services..."
docker-compose down

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.yml --profile production up -d

# Run database migrations
echo "📊 Running database migrations..."
docker-compose exec backend npx prisma migrate deploy

# Deploy smart contracts
echo "⛓️ Deploying smart contracts..."
docker-compose run --rm contracts forge script script/Deploy.s.sol --broadcast --rpc-url $ETHEREUM_RPC_URL

# Show status
echo "✅ Deployment completed!"
echo ""
echo "🌐 Access points:"
echo "  Frontend:     https://riskguardian.ai"
echo "  Backend API:  https://api.riskguardian.ai"
echo "  ElizaOS:      https://eliza.riskguardian.ai"
echo ""
echo "📊 Monitoring:"
echo "  Logs:         docker-compose logs -f"
echo "  Status:       docker-compose ps" 