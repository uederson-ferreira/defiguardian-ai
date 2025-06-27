#!/bin/bash

# MÓDULO: Script de Correção Rápida
# LOCALIZAÇÃO: quick-fix.sh  
# DESCRIÇÃO: Corrige import path no layout.tsx

echo "🔧 Aplicando correção rápida do import path..."

# Verificar se layout.tsx existe
if [ ! -f "app/layout.tsx" ]; then
    echo "❌ app/layout.tsx não encontrado!"
    exit 1
fi

# Fazer backup do layout atual
cp app/layout.tsx app/layout.tsx.backup
echo "📁 Backup criado: app/layout.tsx.backup"

# Corrigir o import path
sed -i '' 's|from "./api/auth/providers"|from "./providers"|g' app/layout.tsx

echo "✅ Import path corrigido em app/layout.tsx"

# Verificar se a correção funcionou
if grep -q 'from "./providers"' app/layout.tsx; then
    echo "✅ Correção aplicada com sucesso!"
    echo "🔍 Verificando import atual:"
    grep "import.*Providers" app/layout.tsx
else
    echo "❌ Correção falhou. Restaurando backup..."
    cp app/layout.tsx.backup app/layout.tsx
    exit 1
fi

# Verificar se providers.tsx existe
if [ ! -f "app/providers.tsx" ]; then
    echo "⚠️ app/providers.tsx não encontrado!"
    echo "📝 Você precisa criar o arquivo app/providers.tsx com o código do artefato"
    echo "💡 Use o artefato 'Providers.tsx Definitivo' que forneci"
else
    echo "✅ app/providers.tsx encontrado"
fi

echo ""
echo "🚀 Correção concluída! Execute:"
echo "   pnpm dev"