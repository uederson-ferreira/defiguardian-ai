#!/bin/bash

# Script to extract and save contract addresses from deployment logs

echo "=== EXTRACTING AVALANCHE CONTRACT ADDRESSES ==="
echo ""

# Create addresses file
cat > .env.avalanche.addresses << 'EOF_ADDRESSES'
# RiskGuardian AI - Avalanche Deployed Contract Addresses
# Generated automatically from deployment

# ===== CORE CONTRACTS =====
CONTRACT_REGISTRY_ADDRESS=
RISK_REGISTRY_ADDRESS=
RISK_ORACLE_ADDRESS=
PORTFOLIO_ANALYZER_ADDRESS=

# ===== AUTOMATION CONTRACTS =====
ALERT_SYSTEM_ADDRESS=
RISK_GUARDIAN_MASTER_ADDRESS=

# ===== HEDGING CONTRACTS =====
STOP_LOSS_HEDGE_ADDRESS=
REBALANCE_HEDGE_ADDRESS=
VOLATILITY_HEDGE_ADDRESS=
CROSS_CHAIN_HEDGE_ADDRESS=

# ===== INSURANCE CONTRACTS =====
RISK_INSURANCE_ADDRESS=

# ===== MOCK SYSTEM (TESTNET) =====
AVALANCHE_SETUP_ADDRESS=

# ===== AVALANCHE CONFIGURATION =====
AVALANCHE_FUJI_RPC=https://api.avax-test.network/ext/bc/C/rpc
AVALANCHE_MAINNET_RPC=https://api.avax.network/ext/bc/C/rpc
SNOWTRACE_API_KEY=your_snowtrace_api_key

# ===== AVALANCHE TOKENS =====
WAVAX_ADDRESS=0xd00ae08403B9bbb9124bB305C09058E32C39A48c
WETH_E_ADDRESS=0x49D5c2BdFfac6CE2BFdB6640F4F80f226bc10bAB
WBTC_E_ADDRESS=0x50b7545627a5162F82A992c33b87aDc75187B218
USDC_E_ADDRESS=0x5425890298aed601595a70AB815c96711a31Bc65

# ===== AVALANCHE PROTOCOLS =====
TRADERJOE_FACTORY_ADDRESS=0x9Ad6C38BE94206cA50bb0d90783181662f0Cfa10
AAVE_AVALANCHE_ADDRESS=0x794a61358D6845594F94dc1DB02A252b5b4814aD
BENQI_COMPTROLLER_ADDRESS=0x486Af39519B4Dc9a7fCcd318217352830E8AD9b4
EOF_ADDRESSES

echo "✓ Created .env.avalanche.addresses template"
echo ""
echo "📝 MANUAL STEP REQUIRED:"
echo "Please fill in the contract addresses from your deployment logs"
echo "Look for lines like 'deployed at: 0x...' in the deployment output"
echo ""
echo "📁 File location: .env.avalanche.addresses"
echo ""
echo "After filling the addresses, you can source them:"
echo "source .env.avalanche.addresses"
