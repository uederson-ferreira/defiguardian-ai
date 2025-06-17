#!/bin/bash

# Script de inicialização do nó Chromia/Postchain
# Arquivo: start-chromia.sh

set -e

echo "🔗 Iniciando nó Chromia/Postchain..."
echo "📅 $(date)"
echo "🏗️  Versão: Postchain $(java -cp /app/postchain.jar net.postchain.base.Postchain --version 2>/dev/null || echo 'unknown')"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Verificar variáveis de ambiente
log "Verificando configuração..."
echo "  POSTGRES_HOST: ${POSTGRES_HOST}"
echo "  POSTGRES_PORT: ${POSTGRES_PORT}"
echo "  POSTGRES_DB: ${POSTGRES_DB}"
echo "  POSTGRES_USER: ${POSTGRES_USER}"
echo "  POSTCHAIN_CONFIG_FILE: ${POSTCHAIN_CONFIG_FILE}"

# Aguardar PostgreSQL
log "Aguardando PostgreSQL..."
./wait-for-postgres.sh

# Verificar se os JARs existem
if [ ! -f "/app/postchain.jar" ]; then
    error "postchain.jar não encontrado!"
    exit 1
fi

if [ ! -f "/app/postgresql.jar" ]; then
    error "postgresql.jar não encontrado!"
    exit 1
fi

log "JARs verificados:"
ls -la /app/*.jar

# Configurar classpath
export CLASSPATH="/app/postchain.jar:/app/postgresql.jar:$CLASSPATH"
log "Classpath configurado: $CLASSPATH"

# Verificar arquivo de configuração
if [ ! -f "$POSTCHAIN_CONFIG_FILE" ]; then
    error "Arquivo de configuração não encontrado: $POSTCHAIN_CONFIG_FILE"
    exit 1
fi

log "Configuração encontrada:"
cat "$POSTCHAIN_CONFIG_FILE"

# Criar configuração de blockchain se não existir
BLOCKCHAIN_CONFIG="/app/config/blockchain.xml"
if [ ! -f "$BLOCKCHAIN_CONFIG" ]; then
    warn "Criando configuração de blockchain..."
    cat > "$BLOCKCHAIN_CONFIG" << 'EOF'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<dict>
    <entry key="blockchainRid">
        <string>78967baa4768cbcef11c508326ffb13a956689fcb6dc3ba17f4b895cbb1577a3</string>
    </entry>
    <entry key="configHeight">
        <int>0</int>
    </entry>
    <entry key="gtx">
        <dict>
            <entry key="rell">
                <dict>
                    <entry key="version">
                        <string>0.10.8</string>
                    </entry>
                    <entry key="sources">
                        <dict>
                            <entry key="portfolio.rell">
                                <string>src/rell/portfolio.rell</string>
                            </entry>
                        </dict>
                    </entry>
                </dict>
            </entry>
        </dict>
    </entry>
    <entry key="signers">
        <array>
            <string>03a301697bdfcd704313ba48e51d567543f2a182031efd6915ddc07bbcc4e16070</string>
        </array>
    </entry>
</dict>
EOF
fi

# Preparar diretório de dados
mkdir -p /app/data
mkdir -p /app/logs

# Configurar permissões
chmod -R 755 /app/data
chmod -R 755 /app/logs

log "Iniciando Postchain..."

# Comando de inicialização do Postchain
POSTCHAIN_CMD="java $JAVA_OPTS \
    -cp $CLASSPATH \
    -Dpostchain.config.file=$POSTCHAIN_CONFIG_FILE \
    -Dlogback.configurationFile=/app/config/logback.xml \
    net.postchain.Postchain"

info "Comando: $POSTCHAIN_CMD"

# Função para cleanup em caso de sinal
cleanup() {
    log "Recebido sinal de termination, encerrando Postchain..."
    if [ ! -z "$POSTCHAIN_PID" ]; then
        kill -TERM "$POSTCHAIN_PID" 2>/dev/null || true
        wait "$POSTCHAIN_PID" 2>/dev/null || true
    fi
    log "Postchain encerrado"
    exit 0
}

# Configurar handlers de sinais
trap cleanup SIGTERM SIGINT

# Tentar iniciar Postchain
log "🚀 Executando Postchain..."
log "📍 Logs salvos em: /app/logs/"

# Executar o comando em background para poder capturar o PID
$POSTCHAIN_CMD > /app/logs/postchain.log 2>&1 &
POSTCHAIN_PID=$!

log "Postchain iniciado com PID: $POSTCHAIN_PID"

# Aguardar alguns segundos para verificar se iniciou corretamente
sleep 10

# Verificar se o processo ainda está rodando
if kill -0 "$POSTCHAIN_PID" 2>/dev/null; then
    log "✅ Postchain está rodando"
    
    # Tentar fazer uma requisição de health check
    sleep 5
    if curl -f http://localhost:7740/api/v1/node/info > /dev/null 2>&1; then
        log "✅ API do Postchain respondendo"
    else
        warn "⚠️  API ainda não está respondendo (pode levar alguns minutos)"
    fi
else
    error "❌ Postchain falhou ao iniciar"
    cat /app/logs/postchain.log
    exit 1
fi

# Aguardar o processo principal
log "Aguardando Postchain... (Ctrl+C para parar)"
wait "$POSTCHAIN_PID" 