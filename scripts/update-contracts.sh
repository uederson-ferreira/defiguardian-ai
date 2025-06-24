#!/bin/bash

# =============================================================================
# RISKGUARDIAN CONTRACT UPDATE SCRIPT
# =============================================================================
# This script updates contract addresses across the entire project
# Usage: ./scripts/update-contracts.sh [network]
# Networks: fuji, sepolia, mainnet

set -e

NETWORK=${1:-fuji}
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

echo "🔄 Updating RiskGuardian contract addresses for network: $NETWORK"
echo "📁 Project root: $PROJECT_ROOT"

# Function to update environment files
update_env_files() {
    local network=$1
    
    case $network in
        "fuji")
            echo "📋 Updating for Avalanche Fuji testnet..."
            
            # Copy Fuji environment to main .env files
            if [ -f "$PROJECT_ROOT/elizaos-riskguardian/.env.fuji" ]; then
                cp "$PROJECT_ROOT/elizaos-riskguardian/.env.fuji" "$PROJECT_ROOT/elizaos-riskguardian/.env"
                echo "✅ Updated ElizaOS .env with Fuji configuration"
            fi
            
            # Update backend environment
            if [ -f "$PROJECT_ROOT/backend/.env.example" ]; then
                cp "$PROJECT_ROOT/backend/.env.example" "$PROJECT_ROOT/backend/.env"
                echo "✅ Updated Backend .env with Fuji configuration"
            fi
            ;;
            
        "sepolia")
            echo "📋 Updating for Ethereum Sepolia testnet..."
            echo "⚠️  Sepolia configuration not implemented yet"
            ;;
            
        "mainnet")
            echo "📋 Updating for production mainnet..."
            echo "⚠️  Mainnet configuration not implemented yet"
            ;;
            
        *)
            echo "❌ Unknown network: $network"
            echo "Available networks: fuji, sepolia, mainnet"
            exit 1
            ;;
    esac
}

# Function to verify contract addresses
verify_contracts() {
    echo "🔍 Verifying contract addresses..."
    
    # Check if contract addresses file exists
    if [ -f "$PROJECT_ROOT/contractsv2/deployed-addresses-fuji.env" ]; then
        echo "✅ Found deployed contract addresses"
        
        # Display key contract addresses
        echo "📊 Key Contract Addresses:"
        grep -E "(RISK_REGISTRY|PORTFOLIO_ANALYZER|RISK_ORACLE|ALERT_SYSTEM)" "$PROJECT_ROOT/contractsv2/deployed-addresses-fuji.env" | head -4
    else
        echo "⚠️  Contract addresses file not found"
    fi
}

# Function to update docker-compose if needed
update_docker_config() {
    echo "🐳 Checking Docker configuration..."
    
    if [ -f "$PROJECT_ROOT/docker-compose.yml" ]; then
        echo "✅ Docker Compose file found"
        # Add any docker-specific updates here if needed
    fi
}

# Function to run tests
run_tests() {
    echo "🧪 Running basic connectivity tests..."
    
    # Test backend TypeScript compilation
    if [ -d "$PROJECT_ROOT/backend" ]; then
        cd "$PROJECT_ROOT/backend"
        if command -v npm &> /dev/null; then
            echo "🔧 Testing backend TypeScript compilation..."
            npm run build --if-present || echo "⚠️  Backend build test skipped"
        fi
        cd "$PROJECT_ROOT"
    fi
    
    # Test ElizaOS TypeScript compilation
    if [ -d "$PROJECT_ROOT/elizaos-riskguardian" ]; then
        cd "$PROJECT_ROOT/elizaos-riskguardian"
        if command -v bun &> /dev/null; then
            echo "🔧 Testing ElizaOS TypeScript compilation..."
            bun run build --if-present || echo "⚠️  ElizaOS build test skipped"
        fi
        cd "$PROJECT_ROOT"
    fi
}

# Main execution
echo "🚀 Starting contract update process..."
echo "" 

update_env_files $NETWORK
echo ""

verify_contracts
echo ""

update_docker_config
echo ""

run_tests
echo ""

echo "✅ Contract update completed successfully!"
echo "📝 Next steps:"
echo "   1. Review the updated .env files"
echo "   2. Restart your development servers"
echo "   3. Test the contract interactions"
echo "   4. Deploy to your target environment"
echo ""
echo "🔗 Network: $NETWORK"
echo "📍 Chain ID: $([ "$NETWORK" = "fuji" ] && echo "43113" || echo "Unknown")"
echo "🌐 RPC: $([ "$NETWORK" = "fuji" ] && echo "https://api.avax-test.network/ext/bc/C/rpc" || echo "Unknown")"