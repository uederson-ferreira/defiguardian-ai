# =============================================================================
# 🔧 PROBLEMA: Foundry espera prefixo "0x" na chave privada
# =============================================================================

# SOLUÇÃO 1: ADICIONAR 0x À CHAVE NO .env (MAIS SIMPLES)
echo "🔧 Adicionando prefixo 0x à chave privada..."

# Carregar valor atual
source .env

# Verificar se já tem 0x
if [[ $PRIVATE_KEY == 0x* ]]; then
    echo "✅ PRIVATE_KEY já tem prefixo 0x"
else
    echo "🔧 Adicionando prefixo 0x à PRIVATE_KEY..."
    
    # Fazer backup do .env
    cp .env .env.backup
    
    # Substituir PRIVATE_KEY no arquivo
    sed -i.tmp "s/PRIVATE_KEY=$PRIVATE_KEY/PRIVATE_KEY=0x$PRIVATE_KEY/" .env
    
    # Remover arquivo temporário
    rm .env.tmp
    
    echo "✅ Prefixo 0x adicionado"
fi

# Fazer o mesmo para PRIVATE_KEY_RONIN se existir
if [[ -n "$PRIVATE_KEY_RONIN" ]] && [[ ! $PRIVATE_KEY_RONIN == 0x* ]]; then
    echo "🔧 Adicionando prefixo 0x à PRIVATE_KEY_RONIN..."
    sed -i.tmp "s/PRIVATE_KEY_RONIN=$PRIVATE_KEY_RONIN/PRIVATE_KEY_RONIN=0x$PRIVATE_KEY_RONIN/" .env
    rm .env.tmp
    echo "✅ Prefixo 0x adicionado à PRIVATE_KEY_RONIN"
fi

# Carregar novamente
source .env

echo "🔍 Verificando chaves atualizadas:"
echo "PRIVATE_KEY: ${PRIVATE_KEY:0:8}...${PRIVATE_KEY: -4}"
[[ -n "$PRIVATE_KEY_RONIN" ]] && echo "PRIVATE_KEY_RONIN: ${PRIVATE_KEY_RONIN:0:8}...${PRIVATE_KEY_RONIN: -4}"

# FAZER O DEPLOY NOVAMENTE
echo ""
echo "🚀 Fazendo deploy na Ronin Saigon (com prefixo 0x)..."
forge script script/Deploy.s.sol:DeployComplete \
    --rpc-url https://saigon-testnet.roninchain.com/rpc \
    --private-key ${PRIVATE_KEY} \
    --broadcast \
    -vvv