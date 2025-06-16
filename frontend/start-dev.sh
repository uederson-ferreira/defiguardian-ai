#!/bin/bash

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Função para exibir mensagens
log() {
  echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
  echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
}

warn() {
  echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
  error "Node.js não está instalado. Por favor, instale o Node.js e tente novamente."
  exit 1
fi

# Criar diretório de logs se não existir
mkdir -p logs

# Instalar dependências se node_modules não existir
if [ ! -d "node_modules" ]; then
  log "Instalando dependências..."
  npm install
fi

# Verificar se .env.local existe, se não copiar do exemplo
if [ ! -f ".env.local" ] && [ -f ".env.local.example" ]; then
  log "Copiando .env.local.example para .env.local..."
  cp .env.local.example .env.local
  warn "Arquivo .env.local criado. Por favor, atualize as variáveis de ambiente."
fi

# Iniciar o servidor de desenvolvimento
log "Iniciando servidor de desenvolvimento..."
npm run dev 