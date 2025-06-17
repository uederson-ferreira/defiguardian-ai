#!/bin/bash

# Script para aguardar PostgreSQL estar pronto
# Arquivo: wait-for-postgres.sh

set -e

echo "🔗 Aguardando PostgreSQL estar pronto..."

# Configuração
POSTGRES_HOST=${POSTGRES_HOST:-postgres}
POSTGRES_PORT=${POSTGRES_PORT:-5432}
POSTGRES_USER=${POSTGRES_USER:-chromia}
POSTGRES_DB=${POSTGRES_DB:-chromia}
MAX_ATTEMPTS=30
ATTEMPT=0

# Função de log
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Aguardar PostgreSQL responder
until pg_isready -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
    ATTEMPT=$((ATTEMPT + 1))
    
    if [ $ATTEMPT -gt $MAX_ATTEMPTS ]; then
        log "❌ Timeout: PostgreSQL não ficou pronto após $MAX_ATTEMPTS tentativas"
        exit 1
    fi
    
    log "⏳ PostgreSQL não está pronto (tentativa $ATTEMPT/$MAX_ATTEMPTS) - aguardando..."
    sleep 2
done

log "✅ PostgreSQL está pronto!"

# Testar conexão efetiva
log "🔍 Testando conexão com banco de dados..."

if PGPASSWORD="$POSTGRES_PASSWORD" psql -h "$POSTGRES_HOST" -p "$POSTGRES_PORT" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "SELECT 1;" >/dev/null 2>&1; then
    log "✅ Conexão com banco de dados confirmada!"
else
    log "⚠️  Banco responde mas conexão falhando - continuando..."
fi

log "🚀 PostgreSQL pronto para Chromia!" 