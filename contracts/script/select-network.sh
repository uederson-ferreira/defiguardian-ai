#!/bin/bash

# =============================================================================
# 🎯 RiskGuardian AI - Seletor de Rede para Deploy
# =============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

clear

echo -e "${BOLD}${PURPLE}"
echo "╔══════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                              ║"
echo "║                   🎯 RISKGUARDIAN AI - SELETOR DE REDE 🎯                     ║"
echo "║                                                                              ║"
echo "║                      Escolha a melhor rede para deploy                       ║"
echo "║                                                                              ║"
echo "╚══════════════════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo
echo -e "${BLUE}📊 Opções de Deploy Disponíveis:${NC}"
echo

echo -e "${GREEN}1. 🔥 SEPOLIA TESTNET (RECOMENDADO para DeFi)${NC}"
echo "   ✅ Protocolos DeFi reais (Uniswap, Aave, Compound)"
echo "   ✅ Chainlink price feeds funcionando"
echo "   ✅ Etherscan verification automática"
echo "   ✅ Ambiente oficial Ethereum"
echo "   ✅ Melhor para testes realistas"
echo "   ⚠️  Gas fees moderadas (~15s finality)"
echo

echo -e "${CYAN}2. ⚡ RONIN SAIGON TESTNET (Para gaming/speed)${NC}"
echo "   ✅ Transações ultra-rápidas (~2s finality)"
echo "   ✅ Taxas quase zero"
echo "   ✅ Faucet generoso"
echo "   ❌ Poucos protocolos DeFi (precisaria mocks)"
echo "   ❌ Sem Chainlink feeds (precisaria mocks)"
echo "   ❌ Verificação manual apenas"
echo

echo -e "${YELLOW}3. 🔧 LOCAL ANVIL (Para desenvolvimento)${NC}"
echo "   ✅ Deploy instantâneo"
echo "   ✅ Controle total"
echo "   ✅ Fork da mainnet possível"
echo "   ❌ Dados resetam ao reiniciar"
echo "   ❌ Não permanente"
echo

echo -e "${PURPLE}4. 📚 VER COMPARAÇÃO DETALHADA${NC}"
echo

echo -e "${BLUE}────────────────────────────────────────────────────────────${NC}"

read -p "Escolha uma opção [1-4]: " choice

case $choice in
    1)
        echo
        echo -e "${GREEN}🔥 Excelente escolha! Sepolia é perfeito para DeFi${NC}"
        echo
        echo -e "${YELLOW}📋 Preparação necessária:${NC}"
        echo "1. Adicione ETHERSCAN_API_KEY ao .env"
        echo "2. Obtenha ETH da Sepolia no faucet"
        echo "3. Execute o deploy"
        echo
        echo -e "${BLUE}🚀 Comandos:${NC}"
        echo "# 1. Configure API key (obtenha em https://etherscan.io/apis)"
        echo "echo 'ETHERSCAN_API_KEY=your_api_key_here' >> .env"
        echo
        echo "# 2. Obtenha ETH (https://sepoliafaucet.com/)"
        echo "# 3. Deploy"
        echo "chmod +x script/deploy-sepolia.sh"
        echo "./script/deploy-sepolia.sh"
        echo
        echo -e "${GREEN}✨ Vantagens da sua escolha:${NC}"
        echo "• Testar com Uniswap V3 real"
        echo "• Chainlink price feeds funcionando"
        echo "• Source code verificado automaticamente"
        echo "• Ambiente muito próximo da mainnet"
        echo
        read -p "Executar deploy na Sepolia agora? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [[ -f "script/deploy-sepolia.sh" ]]; then
                chmod +x script/deploy-sepolia.sh
                ./script/deploy-sepolia.sh
            else
                echo -e "${RED}❌ Arquivo script/deploy-sepolia.sh não encontrado${NC}"
            fi
        fi
        ;;
        
    2)
        echo
        echo -e "${CYAN}⚡ Ronin Saigon - Ótimo para speed e custos baixos!${NC}"
        echo
        echo -e "${YELLOW}📋 Preparação necessária:${NC}"
        echo "1. Obtenha RON tokens do faucet"
        echo "2. Execute o deploy (sem verificação automática)"
        echo
        echo -e "${BLUE}🚀 Comandos:${NC}"
        echo "# 1. Obtenha RON tokens (https://faucet.roninchain.com/)"
        echo "# 2. Deploy"
        echo "chmod +x script/deploy-ronin-optimized.sh"
        echo "./script/deploy-ronin-optimized.sh"
        echo
        echo "# 3. Verificação manual"
        echo "chmod +x verify-ronin-contracts.sh"
        echo "./verify-ronin-contracts.sh"
        echo
        echo -e "${GREEN}✨ Vantagens da sua escolha:${NC}"
        echo "• Transações ultra-rápidas"
        echo "• Custos quase zero"
        echo "• Rede focada em gaming/DeFi"
        echo
        echo -e "${YELLOW}⚠️  Limitações:${NC}"
        echo "• Precisará usar price feeds mock"
        echo "• Poucos protocolos DeFi reais"
        echo "• Verificação manual apenas"
        echo
        read -p "Executar deploy na Ronin agora? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if [[ -f "deploy-ronin-optimized.sh" ]]; then
                chmod +x deploy-ronin-optimized.sh
                ./deploy-ronin-optimized.sh
            else
                echo -e "${RED}❌ Arquivo deploy-ronin-optimized.sh não encontrado${NC}"
            fi
        fi
        ;;
        
    3)
        echo
        echo -e "${YELLOW}🔧 Ambiente Local - Perfeito para desenvolvimento!${NC}"
        echo
        echo -e "${BLUE}🚀 Comandos:${NC}"
        echo "# 1. Certifique-se que Anvil está rodando"
        echo "docker-compose ps anvil"
        echo
        echo "# 2. Deploy local"
        echo "cd contracts"
        echo "forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key \$PRIVATE_KEY --broadcast -vvv"
        echo
        echo -e "${GREEN}✨ Vantagens:${NC}"
        echo "• Deploy instantâneo"
        echo "• Sem custos"
        echo "• Controle total"
        echo "• Fork da mainnet possível"
        echo
        echo -e "${YELLOW}⚠️  Limitação:${NC}"
        echo "• Dados resetam ao reiniciar Docker"
        ;;
        
    4)
        echo
        echo -e "${PURPLE}📚 Abrindo comparação detalhada...${NC}"
        echo
        echo "═══════════════════════════════════════════════════════════════════════════════"
        echo -e "${BOLD}🏆 SEPOLIA vs RONIN - COMPARAÇÃO DETALHADA${NC}"
        echo "═══════════════════════════════════════════════════════════════════════════════"
        echo
        echo -e "${GREEN}🔥 SEPOLIA TESTNET:${NC}"
        echo "────────────────────────"
        echo "✅ Protocolos: Uniswap V3, Aave V3, Compound V3 (REAIS)"
        echo "✅ Price Feeds: Chainlink ETH/USD, BTC/USD, USDC/USD (REAIS)"
        echo "✅ Verificação: Etherscan automática"
        echo "✅ Ferramentas: Suporte completo Foundry/Hardhat"
        echo "✅ Debugging: Source code verificado, stack traces"
        echo "✅ Demonstrações: Protocolos conhecidos pelos investidores"
        echo "⚠️  Velocidade: ~15s finality"
        echo "⚠️  Custos: Gas fees moderadas"
        echo
        echo -e "${CYAN}⚡ RONIN SAIGON:${NC}"
        echo "────────────────────────"
        echo "✅ Velocidade: ~2s finality (muito rápido)"
        echo "✅ Custos: Quase zero (ideal para muitas transações)"
        echo "✅ Faucet: Generoso e confiável"
        echo "❌ Protocolos: Poucos DeFi nativos (precisaria mocks)"
        echo "❌ Price Feeds: Sem Chainlink (precisaria mocks)"
        echo "❌ Verificação: Manual apenas (sem Etherscan)"
        echo "❌ Ecosystem: Focado em gaming, não DeFi"
        echo
        echo "═══════════════════════════════════════════════════════════════════════════════"
        echo -e "${BOLD}🎯 RECOMENDAÇÃO PARA RISKGUARDIAN AI:${NC}"
        echo "═══════════════════════════════════════════════════════════════════════════════"
        echo
        echo -e "${GREEN}🏆 SEPOLIA É A MELHOR ESCOLHA PORQUE:${NC}"
        echo "1. 🎯 RiskGuardian é focado em DeFi (Sepolia tem protocolos DeFi reais)"
        echo "2. 📊 Precisa de price feeds confiáveis (Chainlink funciona na Sepolia)"
        echo "3. 🔍 Debugging é crucial (Etherscan na Sepolia)"
        echo "4. 💼 Demonstrações realistas (investidores conhecem Uniswap/Aave)"
        echo "5. 🚀 Preparação para mainnet (ambiente muito similar)"
        echo
        echo -e "${YELLOW}⚡ Ronin seria melhor apenas se:${NC}"
        echo "• Fosse um jogo blockchain"
        echo "• Precisasse de milhares de microtransações"
        echo "• Integrasse com Axie Infinity"
        echo
        echo "═══════════════════════════════════════════════════════════════════════════════"
        echo
        read -p "Qual rede você escolhe? (1=Sepolia, 2=Ronin, 3=Local): " final_choice
        
        case $final_choice in
            1) 
                echo -e "${GREEN}🔥 Excelente! Sepolia é perfeita para RiskGuardian AI${NC}"
                echo "Execute: ./script/deploy-sepolia.sh"
                ;;
            2) 
                echo -e "${CYAN}⚡ Ronin escolhida! Lembre-se das limitações de DeFi${NC}"
                echo "Execute: ./script/deploy-ronin-optimized.sh"
                ;;
            3) 
                echo -e "${YELLOW}🔧 Local escolhido! Ideal para desenvolvimento inicial${NC}"
                echo "Execute: forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --private-key \$PRIVATE_KEY --broadcast"
                ;;
            *) 
                echo -e "${RED}❌ Opção inválida${NC}"
                ;;
        esac
        ;;
        
    *)
        echo
        echo -e "${RED}❌ Opção inválida. Escolha 1-4.${NC}"
        exit 1
        ;;
esac

echo
echo -e "${BLUE}📚 Recursos úteis:${NC}"
echo "• Sepolia Faucet: https://sepoliafaucet.com/"
echo "• Ronin Faucet: https://faucet.roninchain.com/"
echo "• Etherscan API: https://etherscan.io/apis"
echo "• Foundry Docs: https://book.getfoundry.sh/"
echo