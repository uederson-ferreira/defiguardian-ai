#!/bin/bash

echo "🚀 Starting RiskGuardian AI Development Environment"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run ./scripts/setup.sh first"
    exit 1
fi

# Start core services
echo "🐳 Starting containers..."
docker-compose up -d

# Wait a moment for containers to initialize
echo "⏳ Waiting for services to initialize..."
sleep 10

# Show status
echo "📊 Container status:"
docker-compose ps

echo ""
echo "✅ Development environment started!"
echo ""
echo "🌐 Access points:"
echo "  Frontend:     http://localhost:3000"
echo "  Backend API:  http://localhost:8000" 
echo "  ElizaOS:      http://localhost:3001"
echo "  Chromia:      http://localhost:7740"
echo ""
echo "📋 View logs: docker-compose logs -f [service-name]"
echo "🛑 Stop all: ./scripts/stop.sh"

# Optional: Show logs
read -p "Show live logs? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi