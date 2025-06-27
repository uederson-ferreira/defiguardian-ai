#!/bin/bash

# MÓDULO: Debug NextAuth e Google Login
# LOCALIZAÇÃO: debug-nextauth.sh
# DESCRIÇÃO: Verifica configuração do NextAuth para resolver login Google

echo "🔍 VERIFICANDO CONFIGURAÇÃO NEXTAUTH..."

# 1. Verificar variáveis de ambiente essenciais
echo ""
echo "📋 Verificando variáveis ENV essenciais:"

if [ -f ".env.local" ]; then
    echo "✅ .env.local encontrado"
    
    # Verificar variáveis críticas (sem exibir valores)
    ENV_VARS=("NEXTAUTH_SECRET" "NEXTAUTH_URL" "GOOGLE_CLIENT_ID" "GOOGLE_CLIENT_SECRET")
    
    for var in "${ENV_VARS[@]}"; do
        if grep -q "^$var=" .env.local; then
            echo "✅ $var configurado"
        else
            echo "❌ $var FALTANDO!"
        fi
    done
else
    echo "❌ .env.local não encontrado!"
    echo "💡 Crie o arquivo .env.local com as variáveis necessárias"
fi

# 2. Verificar arquivo de configuração NextAuth
echo ""
echo "📋 Verificando configuração NextAuth:"

if [ -f "app/api/auth/[...nextauth]/route.ts" ]; then
    echo "✅ Route NextAuth encontrado"
    
    # Verificar se Google provider está configurado
    if grep -q "GoogleProvider" app/api/auth/\[...nextauth\]/route.ts; then
        echo "✅ Google Provider configurado"
    else
        echo "❌ Google Provider não encontrado!"
    fi
    
    # Verificar se authOptions está exportado
    if grep -q "export.*authOptions" app/api/auth/\[...nextauth\]/route.ts; then
        echo "✅ authOptions exportado"
    else
        echo "❌ authOptions não exportado!"
    fi
    
else
    echo "❌ Route NextAuth não encontrado em app/api/auth/[...nextauth]/route.ts"
fi

# 3. Testar endpoint NextAuth
echo ""
echo "📋 Testando endpoints NextAuth:"

# Testar se servidor está rodando
if curl -s http://localhost:3000/api/auth/providers >/dev/null 2>&1; then
    echo "✅ Endpoint /api/auth/providers acessível"
    
    # Verificar se Google está na lista de providers
    PROVIDERS=$(curl -s http://localhost:3000/api/auth/providers)
    if echo "$PROVIDERS" | grep -q "google"; then
        echo "✅ Google provider ativo"
    else
        echo "❌ Google provider não ativo!"
        echo "📋 Providers disponíveis:"
        echo "$PROVIDERS" | jq . 2>/dev/null || echo "$PROVIDERS"
    fi
else
    echo "❌ Servidor não está rodando ou endpoint não acessível"
    echo "💡 Execute 'pnpm dev' em outro terminal"
fi

# 4. Verificar callback URLs
echo ""
echo "📋 URLs de Callback esperadas:"
echo "🔗 Google Console: http://localhost:3000/api/auth/callback/google"
echo "🔗 NextAuth: http://localhost:3000/api/auth/callback/google"

# 5. Dicas de configuração
echo ""
echo "💡 DICAS PARA RESOLVER LOGIN GOOGLE:"
echo ""
echo "1. Verificar .env.local:"
echo "   NEXTAUTH_SECRET=sua-chave-secreta-aqui"
echo "   NEXTAUTH_URL=http://localhost:3000"
echo "   GOOGLE_CLIENT_ID=seu-client-id"
echo "   GOOGLE_CLIENT_SECRET=seu-client-secret"
echo ""
echo "2. Verificar Google Cloud Console:"
echo "   - APIs & Services > Credentials"
echo "   - Authorized redirect URIs deve incluir:"
echo "     http://localhost:3000/api/auth/callback/google"
echo ""
echo "3. Testar endpoint manualmente:"
echo "   curl http://localhost:3000/api/auth/providers"
echo ""
echo "4. Verificar logs do NextAuth:"
echo "   - Adicione debug: true na configuração"
echo "   - Verifique console do servidor"

echo ""
echo "🔍 Verificação concluída!"