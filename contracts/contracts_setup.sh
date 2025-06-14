#!/bin/bash

# =============================================================================
# 🏗️ RiskGuardian AI - Smart Contracts Setup
# =============================================================================
# Automated setup for smart contracts development environment
# Installs dependencies, compiles contracts, runs tests, and deploys locally
# =============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Emojis for better UX
ROCKET="🚀"
HAMMER="🔨"
TEST="🧪"
CHECK="✅"
WARNING="⚠️"
GEAR="⚙️"
DEPLOY="🚢"
FIRE="🔥"

print_header() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo ""
}

print_step() {
    echo -e "${BLUE}${2}${NC}"
}

print_success() {
    echo -e "${GREEN}${2}${NC}"
}

print_warning() {
    echo -e "${YELLOW}${2}${NC}"
}

print_error() {
    echo -e "${RED}${2}${NC}"
}

check_requirements() {
    print_step "$GEAR" "Checking requirements..."
    
    # Check if we're in the right directory
    if [ ! -f "foundry.toml" ]; then
        print_error "❌" "foundry.toml not found. Are you in the contracts directory?"
        exit 1
    fi
    
    # Check if forge is installed
    if ! command -v forge &> /dev/null; then
        print_error "❌" "Foundry not found. Please install it first:"
        echo "curl -L https://foundry.paradigm.xyz | bash"
        echo "foundryup"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        print_error "❌" "Git not found. Please install Git first."
        exit 1
    fi
    
    print_success "$CHECK" "All requirements satisfied"
}

init_foundry_project() {
    print_step "$HAMMER" "Initializing Foundry project..."
    
    # Initialize if not already done
    if [ ! -d "lib" ]; then
        forge init --force
        print_success "$CHECK" "Foundry project initialized"
    else
        print_warning "$WARNING" "Foundry project already initialized"
    fi
}

install_dependencies() {
    print_step "$HAMMER" "Installing smart contract dependencies..."
    
    # Install OpenZeppelin Contracts
    if [ ! -d "lib/openzeppelin-contracts" ]; then
        print_step "$GEAR" "Installing OpenZeppelin Contracts..."
        forge install OpenZeppelin/openzeppelin-contracts --no-commit
    fi
    
    # Install Chainlink Contracts
    if [ ! -d "lib/chainlink" ]; then
        print_step "$GEAR" "Installing Chainlink Contracts..."
        forge install smartcontractkit/chainlink --no-commit
    fi
    
    # Install Forge Standard Library (should already be there)
    if [ ! -d "lib/forge-std" ]; then
        print_step "$GEAR" "Installing Forge Standard Library..."
        forge install foundry-rs/forge-std --no-commit
    fi
    
    print_success "$CHECK" "Dependencies installed successfully"
}

create_directory_structure() {
    print_step "$GEAR" "Creating directory structure..."
    
    # Create necessary directories
    mkdir -p src/{interfaces,libraries,mocks}
    mkdir -p test/{unit,integration,fuzz}
    mkdir -p script/{deploy,upgrade,utils}
    mkdir -p docs
    
    print_success "$CHECK" "Directory structure created"
}

compile_contracts() {
    print_step "$HAMMER" "Compiling smart contracts..."
    
    # Clean previous compilation
    forge clean
    
    # Compile contracts
    if forge build; then
        print_success "$CHECK" "Contracts compiled successfully"
    else
        print_error "❌" "Compilation failed"
        exit 1
    fi
}

run_tests() {
    print_step "$TEST" "Running smart contract tests..."
    
    # Run tests with gas reporting
    if forge test --gas-report; then
        print_success "$CHECK" "All tests passed"
    else
        print_error "❌" "Some tests failed"
        echo ""
        print_warning "$WARNING" "Run 'forge test -vvv' for detailed output"
        exit 1
    fi
}

check_anvil() {
    print_step "$GEAR" "Checking Anvil blockchain..."
    
    # Check if Anvil is running
    if curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
        http://localhost:8545 > /dev/null 2>&1; then
        print_success "$CHECK" "Anvil is running"
        return 0
    else
        print_warning "$WARNING" "Anvil is not running"
        return 1
    fi
}

deploy_contracts() {
    print_step "$DEPLOY" "Deploying contracts to local network..."
    
    if check_anvil; then
        # Deploy using the deployment script
        if forge script script/Deploy.s.sol:DeployRiskGuardian --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80; then
            print_success "$CHECK" "Contracts deployed successfully"
            echo ""
            print_step "$GEAR" "Contract addresses saved to broadcast/Deploy.s.sol/"
        else
            print_error "❌" "Deployment failed"
            exit 1
        fi
    else
        print_warning "$WARNING" "Skipping deployment - Anvil not running"
        echo "Start Anvil with: docker-compose up -d anvil"
    fi
}

run_integration_tests() {
    print_step "$TEST" "Running integration tests..."
    
    if check_anvil; then
        # Run specific integration tests
        if forge test --match-contract IntegrationTest --rpc-url http://localhost:8545; then
            print_success "$CHECK" "Integration tests passed"
        else
            print_warning "$WARNING" "Some integration tests failed"
        fi
    else
        print_warning "$WARNING" "Skipping integration tests - Anvil not running"
    fi
}

generate_documentation() {
    print_step "$GEAR" "Generating documentation..."
    
    # Generate ABI files
    mkdir -p docs/abi
    
    # Extract ABIs
    if [ -d "out" ]; then
        find out -name "*.sol" -type d | while read -r dir; do
            contract_name=$(basename "$dir" .sol)
            if [ -f "$dir/$contract_name.json" ]; then
                jq '.abi' "$dir/$contract_name.json" > "docs/abi/$contract_name.json" 2>/dev/null || echo "Failed to extract ABI for $contract_name"
            fi
        done
        print_success "$CHECK" "ABI files generated in docs/abi/"
    fi
    
    # Generate Foundry docs (if available)
    if command -v forge doc &> /dev/null; then
        forge doc
        print_success "$CHECK" "Foundry documentation generated"
    fi
}

create_env_example() {
    print_step "$GEAR" "Creating .env.example file..."
    
    cat > .env.example << 'EOF'
# =============================================================================
# RiskGuardian AI - Smart Contracts Environment Variables
# =============================================================================

# Development private key (DO NOT USE IN PRODUCTION)
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# API Keys for external services
ALCHEMY_API_KEY=your_alchemy_api_key_here
INFURA_API_KEY=your_infura_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key_here
OPTIMISM_API_KEY=your_optimism_api_key_here

# Deployment configuration
DEPLOY_VERIFY=false
DEPLOY_GAS_PRICE=20000000000
DEPLOY_GAS_LIMIT=8000000

# Mainnet deployment (PRODUCTION ONLY)
MAINNET_PRIVATE_KEY=your_production_private_key_here
MAINNET_RPC_URL=https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_API_KEY}

# Testnet configuration
GOERLI_RPC_URL=https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}

# Local development
LOCAL_RPC_URL=http://localhost:8545
ANVIL_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
EOF
    
    print_success "$CHECK" ".env.example created"
}

create_makefile() {
    print_step "$GEAR" "Creating Makefile for easy commands..."
    
    cat > Makefile << 'EOF'
# RiskGuardian AI - Smart Contracts Makefile

.PHONY: help install build test deploy clean docs verify

# Default target
help:
	@echo "🏗️ RiskGuardian AI Smart Contracts"
	@echo ""
	@echo "Available commands:"
	@echo "  make install     - Install dependencies"
	@echo "  make build       - Compile contracts"
	@echo "  make test        - Run all tests"
	@echo "  make test-unit   - Run unit tests only"
	@echo "  make test-integration - Run integration tests"
	@echo "  make deploy      - Deploy to local Anvil"
	@echo "  make deploy-testnet - Deploy to testnet"
	@echo "  make verify      - Verify contracts on Etherscan"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make docs        - Generate documentation"
	@echo "  make coverage    - Generate test coverage"
	@echo "  make slither     - Run Slither security analysis"

# Install dependencies
install:
	forge install

# Build contracts
build:
	forge build

# Run all tests
test:
	forge test --gas-report

# Run unit tests only
test-unit:
	forge test --match-path "test/unit/*" -vv

# Run integration tests
test-integration:
	forge test --match-path "test/integration/*" -vv

# Run fuzz tests
test-fuzz:
	forge test --match-path "test/fuzz/*" -vv

# Deploy to local Anvil
deploy:
	forge script script/Deploy.s.sol:DeployRiskGuardian --rpc-url http://localhost:8545 --broadcast --private-key $(ANVIL_PRIVATE_KEY)

# Deploy to Goerli testnet
deploy-goerli:
	forge script script/Deploy.s.sol:DeployRiskGuardian --rpc-url $(GOERLI_RPC_URL) --broadcast --verify --private-key $(PRIVATE_KEY)

# Deploy to Sepolia testnet
deploy-sepolia:
	forge script script/Deploy.s.sol:DeployRiskGuardian --rpc-url $(SEPOLIA_RPC_URL) --broadcast --verify --private-key $(PRIVATE_KEY)

# Verify contracts on Etherscan
verify:
	forge verify-contract --chain-id 1 --etherscan-api-key $(ETHERSCAN_API_KEY) --compiler-version 0.8.19 <CONTRACT_ADDRESS> src/RiskGuardian.sol:RiskRegistry

# Clean build artifacts
clean:
	forge clean

# Generate documentation
docs:
	forge doc

# Generate test coverage
coverage:
	forge coverage --report lcov
	genhtml lcov.info --output-directory coverage

# Run Slither security analysis (requires slither installation)
slither:
	slither . --exclude-dependencies

# Format code
fmt:
	forge fmt

# Gas snapshot
gas-snapshot:
	forge snapshot

# Update dependencies
update:
	forge update

# Run all quality checks
check: build test fmt slither
	@echo "✅ All quality checks passed"
EOF
    
    print_success "$CHECK" "Makefile created"
}

show_summary() {
    print_header "$FIRE RiskGuardian AI Smart Contracts Setup Complete!"
    
    echo -e "${GREEN}🎉 Setup completed successfully!${NC}"
    echo ""
    echo -e "${CYAN}📁 Project Structure:${NC}"
    echo "  src/              - Smart contract source code"
    echo "  test/             - Test files"
    echo "  script/           - Deployment scripts"
    echo "  lib/              - Dependencies"
    echo "  docs/             - Documentation and ABIs"
    echo ""
    echo -e "${CYAN}🔧 Useful Commands:${NC}"
    echo "  make build        - Compile contracts"
    echo "  make test         - Run tests"
    echo "  make deploy       - Deploy to local Anvil"
    echo "  forge test -vvv   - Detailed test output"
    echo "  forge coverage    - Test coverage report"
    echo ""
    echo -e "${CYAN}📋 Smart Contracts:${NC}"
    echo "  ✅ RiskRegistry         - Protocol risk management"
    echo "  ✅ PortfolioAnalyzer    - Portfolio risk analysis"
    echo "  ✅ RiskInsurance        - Risk insurance system"
    echo ""
    echo -e "${CYAN}🌐 Integration:${NC}"
    echo "  📡 Ready for backend integration"
    echo "  🔗 Ready for frontend connection"
    echo "  ⛓️ Compatible with Anvil blockchain"
    echo ""
    if check_anvil; then
        echo -e "${GREEN}✅ Anvil is running - contracts deployed and ready!${NC}"
    else
        echo -e "${YELLOW}⚠️  Start Anvil with: docker-compose up -d anvil${NC}"
    fi
    echo ""
    echo -e "${PURPLE}🚀 Ready to build the future of DeFi risk management!${NC}"
}

# Main execution
main() {
    print_header "$ROCKET RiskGuardian AI - Smart Contracts Setup"
    
    check_requirements
    init_foundry_project
    install_dependencies
    create_directory_structure
    create_env_example
    create_makefile
    compile_contracts
    run_tests
    deploy_contracts
    run_integration_tests
    generate_documentation
    
    show_summary
}

# Handle script arguments
case "$1" in
    "deps")
        install_dependencies
        ;;
    "build")
        compile_contracts
        ;;
    "test")
        run_tests
        ;;
    "deploy")
        deploy_contracts
        ;;
    "docs")
        generate_documentation
        ;;
    *)
        main
        ;;
esac
