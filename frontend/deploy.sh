#!/bin/bash

# ==================================================================================
# Módulo: Deploy Script
# Localização: /frontend/deploy.sh
# ==================================================================================

echo "🚀 INICIANDO DEPLOY PARA VERCEL..."

# 1. Limpar e instalar dependências
echo "📦 Limpando e instalando dependências..."
rm -rf node_modules .next
npm ci

# 2. Build local para verificar erros
echo "🔨 Testando build localmente..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build local! Corrija os erros antes do deploy."
    exit 1
fi

# 3. Deploy para Vercel
echo "🚀 Fazendo deploy para Vercel..."
vercel --prod

echo "✅ Deploy concluído!"
echo "🔗 Acesse: https://defiguardian-ai.vercel.app"
