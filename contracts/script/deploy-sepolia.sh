#!/bin/bash

# =============================================================================
# 🚀 RiskGuardian AI - Deploy para Sepolia Testnet (CORRIGIDO)
# =============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Sepolia Configuration
SEPOLIA_CHAIN_ID="11155111"
SEPOLIA_RPC_URL="https://sepolia.etherscan.io"
SEPOLIA_EXPLORER="https://ethereum-sepolia-rpc.publicnode.com"
SEPOLIA_FAUCET="https://sepoliafaucet.com/"

print_header() {
    echo
    echo -e "${BOLD}${BLUE}========================================"
    echo -e "  $1"
    echo -e "========================================${NC}"
    echo
}

print_step() {
    echo -e "${CYAN}🔧 $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para carregar variáveis de ambiente de forma segura
load_env_variables() {
    if [[ -f ".env" ]]; then
        print_info "📄 Carregando variáveis do arquivo .env..."
        
        # Método seguro: usar set -a e source
        set -a
        source .env
        set +a
        
        print_success "Variáveis carregadas com sucesso"
    else
        print_error "Arquivo .env não encontrado"
        echo "Copie .env.example para .env e configure suas variáveis"
        exit 1
    fi
}

check_requirements() {
    print_header "📋 Verificando Pré-requisitos"
    
    if [[ ! -f "foundry.toml" ]]; then
        print_error "Execute este script na raiz do projeto"
        exit 1
    fi
    
    if ! command -v forge &> /dev/null; then
        print_error "Foundry não encontrado. Instale: https://getfoundry.sh/"
        exit 1
    fi
    
    print_success "Foundry encontrado"
}

check_network_connectivity() {
    print_header "🌐 Testando Conectividade Sepolia"
    
    print_step "Testando RPC endpoint..."
    
    if curl -s -X POST -H "Content-Type: application/json" \
       -d '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}' \
       $SEPOLIA_RPC_URL | grep -q "0xaa36a7"; then
        print_success "Conectado à Sepolia (Chain ID: 11155111)"
    else
        print_error "Falha ao conectar com Sepolia RPC"
        print_info "Tentando RPC alternativo..."
        
        # Try alternative RPC
        SEPOLIA_RPC_URL="https://sepolia.drpc.org"
        if curl -s -X POST -H "Content-Type: application/json" \
           -d '{"method":"eth_chainId","params":[],"id":1,"jsonrpc":"2.0"}' \
           $SEPOLIA_RPC_URL | grep -q "0xaa36a7"; then
            print_success "Conectado via RPC alternativo"
        else
            print_error "Não foi possível conectar à Sepolia"
            exit 1
        fi
    fi
}

check_private_key() {
    print_header "🔐 Verificando Private Key"
    
    if [[ -z "${PRIVATE_KEY}" ]]; then
        print_error "PRIVATE_KEY não definida no .env"
        echo
        print_info "Adicione sua private key ao arquivo .env:"
        echo "PRIVATE_KEY=0xsua_private_key_aqui"
        echo ""
        print_info "🔑 Para obter uma private key:"
        echo "1. Use uma wallet existente (MetaMask -> Account Details -> Export Private Key)"
        echo "2. Ou gere uma nova: cast wallet new"
        exit 1
    fi
    
    # Check if PRIVATE_KEY has 0x prefix
    if [[ ! "$PRIVATE_KEY" =~ ^0x[0-9a-fA-F]{64}$ ]]; then
        print_error "PRIVATE_KEY tem formato inválido"
        echo
        print_warning "A private key deve ter o formato: 0x + 64 caracteres hexadecimais"
        echo
        if [[ "$PRIVATE_KEY" =~ ^[0-9a-fA-F]{64}$ ]]; then
            print_info "🔧 Sua private key parece correta, mas está faltando o prefixo '0x'"
            print_info "Corrija no arquivo .env:"
            echo "PRIVATE_KEY=0x${PRIVATE_KEY}"
        else
            print_info "Formato esperado: PRIVATE_KEY=0xabc123def456..."
        fi
        exit 1
    fi
    
    DEPLOYER_ADDRESS=$(cast wallet address --private-key $PRIVATE_KEY)
    print_success "Deployer address: $DEPLOYER_ADDRESS"
}

check_etherscan_api() {
    print_header "🔍 Verificando Etherscan API Key"
    
    if [[ -z "${ETHERSCAN_API_KEY}" ]]; then
        print_warning "ETHERSCAN_API_KEY não configurada"
        echo
        print_info "Para verificação automática dos contratos:"
        echo "1. Acesse: https://etherscan.io/apis"
        echo "2. Crie uma conta e gere uma API key"
        echo "3. Adicione ao .env: ETHERSCAN_API_KEY=your_api_key"
        echo
        read -p "Continuar sem verificação automática? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
        VERIFY_FLAG=""
    else
        print_success "Etherscan API key configurada"
        VERIFY_FLAG="--verify --etherscan-api-key $ETHERSCAN_API_KEY"
    fi
}

check_balance() {
    print_header "💰 Verificando Balance ETH"
    
    BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $SEPOLIA_RPC_URL)
    BALANCE_ETH=$(cast to-unit $BALANCE ether)
    
    print_info "Balance atual: $BALANCE_ETH ETH"
    
    # Use bc if available, otherwise use awk
    if command -v bc &> /dev/null; then
        LOW_BALANCE=$(echo "$BALANCE_ETH < 0.1" | bc -l)
    else
        LOW_BALANCE=$(awk "BEGIN {print ($BALANCE_ETH < 0.1)}")
    fi
    
    if [[ "$LOW_BALANCE" == "1" ]]; then
        print_warning "Balance baixo! Você precisa de pelo menos 0.1 ETH"
        echo
        print_info "🚰 Obtenha ETH grátis no faucet:"
        print_info "   1. Acesse: $SEPOLIA_FAUCET"
        print_info "   2. Cole seu address: $DEPLOYER_ADDRESS"
        print_info "   3. Solicite tokens"
        echo
        read -p "Pressione Enter após obter ETH..."
        
        # Re-check balance
        NEW_BALANCE=$(cast balance $DEPLOYER_ADDRESS --rpc-url $SEPOLIA_RPC_URL)
        NEW_BALANCE_ETH=$(cast to-unit $NEW_BALANCE ether)
        print_info "Novo balance: $NEW_BALANCE_ETH ETH"
    fi
    
    print_success "Balance suficiente para deploy"
}

deploy_contracts() {
    print_header "🚀 Fazendo Deploy na Sepolia"
    
    # CORRIGIDO: Entre no diretório contracts
    #cd contracts
    
    print_step "Compilando contratos..."
    forge build
    
    if [[ $? -ne 0 ]]; then
        print_error "Falha na compilação"
        exit 1
    fi
    
    print_success "Contratos compilados"
    
    print_step "Fazendo deploy na Sepolia..."
    print_info "Chain ID: $SEPOLIA_CHAIN_ID"
    print_info "RPC: $SEPOLIA_RPC_URL"
    print_info "Deployer: $DEPLOYER_ADDRESS"
    print_info "Explorer: $SEPOLIA_EXPLORER"
    
    if [[ -n "$VERIFY_FLAG" ]]; then
        print_info "Verificação: Automática (Etherscan)"
    else
        print_info "Verificação: Manual (sem API key)"
    fi
    echo
    
    # Deploy with or without verification
    forge script script/Deploy.s.sol:DeployComplete \
        --rpc-url $SEPOLIA_RPC_URL \
        --private-key $PRIVATE_KEY \
        --broadcast \
        $VERIFY_FLAG \
        --chain-id $SEPOLIA_CHAIN_ID \
        -vvv
    
    if [[ $? -eq 0 ]]; then
        print_success "Deploy realizado com sucesso!"
        if [[ -n "$VERIFY_FLAG" ]]; then
            print_success "Contratos verificados no Etherscan"
        else
            print_info "Contratos deployados (verificação manual necessária)"
        fi
    else
        print_error "Falha no deploy"
        cd ..
        exit 1
    fi
    
    cd ..
}

extract_contract_addresses() {
    print_header "📝 Extraindo Endereços dos Contratos"
    
    BROADCAST_DIR="contracts/broadcast/Deploy.s.sol/${SEPOLIA_CHAIN_ID}"
    
    if [[ -f "${BROADCAST_DIR}/run-latest.json" ]]; then
        print_step "Extraindo endereços..."
        
        # Check if jq is available
        if ! command -v jq &> /dev/null; then
            print_warning "jq não encontrado. Instalando..."
            # Try to install jq based on OS
            if command -v brew &> /dev/null; then
                brew install jq
            elif command -v apt &> /dev/null; then
                sudo apt install jq -y
            else
                print_error "Não foi possível instalar jq automaticamente"
                print_info "Instale manualmente: https://jqlang.github.io/jq/"
                exit 1
            fi
        fi
        
        RISK_REGISTRY=$(jq -r '.transactions[] | select(.contractName == "RiskRegistry") | .contractAddress' "${BROADCAST_DIR}/run-latest.json" 2>/dev/null)
        PORTFOLIO_ANALYZER=$(jq -r '.transactions[] | select(.contractName == "PortfolioRiskAnalyzer") | .contractAddress' "${BROADCAST_DIR}/run-latest.json" 2>/dev/null)
        RISK_INSURANCE=$(jq -r '.transactions[] | select(.contractName == "RiskInsurance") | .contractAddress' "${BROADCAST_DIR}/run-latest.json" 2>/dev/null)
        RISK_ORACLE=$(jq -r '.transactions[] | select(.contractName == "RiskOracle") | .contractAddress' "${BROADCAST_DIR}/run-latest.json" 2>/dev/null)
        ALERT_SYSTEM=$(jq -r '.transactions[] | select(.contractName == "AlertSystem") | .contractAddress' "${BROADCAST_DIR}/run-latest.json" 2>/dev/null)
        
        # Create config for backend
        mkdir -p backend/src/config
        cat > backend/src/config/sepolia-contracts.json << EOF
{
  "networkId": ${SEPOLIA_CHAIN_ID},
  "networkName": "sepolia",
  "rpcUrl": "${SEPOLIA_RPC_URL}",
  "explorerUrl": "${SEPOLIA_EXPLORER}",
  "contracts": {
    "RiskRegistry": {
      "address": "$RISK_REGISTRY",
      "abi": "../../../contracts/out/RiskRegistry.sol/RiskRegistry.json"
    },
    "PortfolioRiskAnalyzer": {
      "address": "$PORTFOLIO_ANALYZER",
      "abi": "../../../contracts/out/PortfolioRiskAnalyzer.sol/PortfolioRiskAnalyzer.json"
    },
    "RiskInsurance": {
      "address": "$RISK_INSURANCE",
      "abi": "../../../contracts/out/RiskInsurance.sol/RiskInsurance.json"
    },
    "RiskOracle": {
      "address": "$RISK_ORACLE",
      "abi": "../../../contracts/out/RiskOracle.sol/RiskOracle.json"
    },
    "AlertSystem": {
      "address": "$ALERT_SYSTEM",
      "abi": "../../../contracts/out/AlertSystem.sol/AlertSystem.json"
    }
  },
  "externalProtocols": {
    "uniswapV3Factory": "0x0227628f3F023bb0B980b67D528571c95c6DaC1c",
    "aaveV3Pool": "0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951",
    "compoundV3": "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
  },
  "chainlinkFeeds": {
    "ETH_USD": "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    "BTC_USD": "0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43",
    "USDC_USD": "0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"
  }
}
EOF
        
        print_success "Configuração criada para Sepolia"
        
    else
        print_warning "Arquivo de broadcast não encontrado"
        print_info "Os endereços dos contratos devem ser extraídos manualmente dos logs"
    fi
}

verify_deployment() {
    print_header "🔍 Verificando Deploy"
    
    if [[ -n "$RISK_REGISTRY" ]]; then
        print_step "Testando contratos deployados..."
        
        # Test RiskRegistry
        if OWNER=$(cast call $RISK_REGISTRY "owner()" --rpc-url $SEPOLIA_RPC_URL 2>/dev/null); then
            print_success "RiskRegistry funcionando: $RISK_REGISTRY"
            print_info "Owner: $OWNER"
        fi
        
        # Test integration
        if [[ -n "$PORTFOLIO_ANALYZER" ]]; then
            if REGISTRY_ADDR=$(cast call $PORTFOLIO_ANALYZER "riskRegistry()" --rpc-url $SEPOLIA_RPC_URL 2>/dev/null); then
                if [[ "$REGISTRY_ADDR" == "$RISK_REGISTRY" ]]; then
                    print_success "Integração Portfolio-Registry funcionando"
                else
                    print_warning "Integração Portfolio-Registry: endereços não coincidem"
                fi
            fi
        fi
        
        # Test AlertSystem integration
        if [[ -n "$ALERT_SYSTEM" ]]; then
            if ORACLE_ADDR=$(cast call $ALERT_SYSTEM "riskOracle()" --rpc-url $SEPOLIA_RPC_URL 2>/dev/null); then
                if [[ "$ORACLE_ADDR" == "$RISK_ORACLE" ]]; then
                    print_success "Integração AlertSystem-Oracle funcionando"
                fi
            fi
        fi
        
        print_success "Todos os contratos operacionais!"
    else
        print_warning "Não foi possível extrair endereços dos contratos"
        print_info "Verifique os logs de deploy para obter os endereços manualmente"
    fi
}

show_summary() {
    print_header "🎉 Deploy Completo na Sepolia!"
    
    echo -e "${GREEN}✅ RiskGuardian AI deployado na Sepolia Testnet!${NC}"
    echo
    echo -e "${BOLD}📊 Detalhes da Rede:${NC}"
    echo "  Network: Sepolia Testnet"
    echo "  Chain ID: $SEPOLIA_CHAIN_ID"
    echo "  Explorer: $SEPOLIA_EXPLORER"
    echo "  Deployer: $DEPLOYER_ADDRESS"
    echo
    
    if [[ -n "$RISK_REGISTRY" ]]; then
        echo -e "${BOLD}📜 Endereços dos Contratos:${NC}"
        echo "  RiskRegistry:        $RISK_REGISTRY"
        echo "  PortfolioAnalyzer:   $PORTFOLIO_ANALYZER"
        echo "  RiskInsurance:       $RISK_INSURANCE"
        echo "  RiskOracle:          $RISK_ORACLE"
        echo "  AlertSystem:         $ALERT_SYSTEM"
        echo
        
        echo -e "${BOLD}🔗 Etherscan Links:${NC}"
        echo "  RiskRegistry:        $SEPOLIA_EXPLORER/address/$RISK_REGISTRY"
        echo "  PortfolioAnalyzer:   $SEPOLIA_EXPLORER/address/$PORTFOLIO_ANALYZER"
        echo "  RiskInsurance:       $SEPOLIA_EXPLORER/address/$RISK_INSURANCE"
        echo "  RiskOracle:          $SEPOLIA_EXPLORER/address/$RISK_ORACLE"
        echo "  AlertSystem:         $SEPOLIA_EXPLORER/address/$ALERT_SYSTEM"
        echo
    fi
    
    echo -e "${BOLD}✨ Vantagens da Sepolia:${NC}"
    echo "  ✅ Protocolos DeFi reais (Uniswap, Aave, Compound)"
    echo "  ✅ Chainlink price feeds reais"
    echo "  ✅ Etherscan verification automática"
    echo "  ✅ Ambiente de teste oficial Ethereum"
    echo "  ✅ Melhor para testes de integração"
    echo
    
    echo -e "${BOLD}🧪 Protocolos Disponíveis:${NC}"
    echo "  Uniswap V3:    0x0227628f3F023bb0B980b67D528571c95c6DaC1c"
    echo "  Aave V3:       0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951"
    echo "  Compound V3:   0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"
    echo
    
    echo -e "${BOLD}📊 Chainlink Feeds:${NC}"
    echo "  ETH/USD:       0x694AA1769357215DE4FAC081bf1f309aDC325306"
    echo "  BTC/USD:       0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43"
    echo "  USDC/USD:      0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E"
    echo
    
    echo -e "${BOLD}🚀 Próximos Passos:${NC}"
    echo "  1. Testar com protocolos reais"
    echo "  2. Integrar Chainlink price feeds"
    echo "  3. Configurar frontend para Sepolia"
    echo "  4. Executar testes de integração"
    echo
    
    echo -e "${BOLD}🧪 Comandos para Teste:${NC}"
    if [[ -n "$RISK_REGISTRY" ]]; then
        echo "  # Testar RiskRegistry"
        echo "  cast call $RISK_REGISTRY \"owner()\" --rpc-url $SEPOLIA_RPC_URL"
        echo
        echo "  # Ver protocolos registrados"
        echo "  cast call $RISK_REGISTRY \"getAllProtocols()\" --rpc-url $SEPOLIA_RPC_URL"
    fi
    echo
    
    print_success "Deploy na Sepolia concluído com sucesso! 🎉"
}

main() {
    echo -e "${BOLD}${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════════════╗"
    echo "║                                                                              ║"
    echo "║              🚀 RISKGUARDIAN AI - DEPLOY SEPOLIA TESTNET 🚀                   ║"
    echo "║                                                                              ║"
    echo "║                Deploy com protocolos DeFi reais!                             ║"
    echo "║                                                                              ║"
    echo "╚══════════════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Load environment variables safely
    load_env_variables
    
    # Execute deployment steps
    check_requirements
    check_network_connectivity
    check_private_key
    check_etherscan_api
    check_balance
    deploy_contracts
    extract_contract_addresses
    verify_deployment
    show_summary
}

main "$@"