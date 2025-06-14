#!/bin/bash

# =============================================================================
# 🐛 RiskGuardian AI - Debug Validation Script
# =============================================================================
# Debug version to identify where the validation script is hanging
# =============================================================================

set -e  # Exit on any error
set -x  # Enable debug mode to show all commands

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "🐛 DEBUG: Starting validation debug script..."

# Function to print with timestamp
debug_print() {
    echo "[$(date '+%H:%M:%S')] 🐛 $1"
}

debug_print "Checking current directory..."
pwd

debug_print "Listing files in current directory..."
ls -la

debug_print "Checking for foundry.toml..."
if [ -f "foundry.toml" ]; then
    echo "✅ foundry.toml found"
    cat foundry.toml
else
    echo "❌ foundry.toml not found"
fi

debug_print "Checking for Foundry installation..."
if command -v forge &> /dev/null; then
    echo "✅ Forge found at: $(which forge)"
    forge --version
else
    echo "❌ Forge not found"
fi

debug_print "Checking for src directory..."
if [ -d "src" ]; then
    echo "✅ src directory found"
    ls -la src/
else
    echo "❌ src directory not found"
fi

debug_print "Checking Anvil connection..."
if curl -s -X POST \
    -H "Content-Type: application/json" \
    -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
    http://localhost:8545; then
    echo ""
    echo "✅ Anvil is responding"
else
    echo "❌ Anvil not responding"
fi

debug_print "Checking environment variables..."
echo "PRIVATE_KEY set: ${PRIVATE_KEY:+yes}"
echo "HOME: $HOME"
echo "PATH: $PATH"

debug_print "Checking Node.js..."
if command -v node &> /dev/null; then
    echo "✅ Node.js found: $(node --version)"
else
    echo "❌ Node.js not found"
fi

debug_print "Trying to run forge build..."
if forge build 2>&1; then
    echo "✅ Forge build successful"
else
    echo "❌ Forge build failed"
fi

debug_print "Debug script completed successfully!"