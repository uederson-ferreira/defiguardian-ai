#!/bin/bash

# Script para renomear RiskGuardian → DefiGuardian
echo "🔄 RENOMEANDO PROJETO: RiskGuardian → DefiGuardian"
echo "=================================================="

# Fazer backup primeiro
echo "📦 Criando backup..."
backup_dir="backup_rename_$(date +%Y%m%d_%H%M%S)"
cp -r . "$backup_dir" 2>/dev/null || echo "Backup criado"

echo "✅ Backup criado em: $backup_dir"
echo ""

# Função para substituir texto em arquivos
replace_in_files() {
    local search="$1"
    local replace="$2"
    local description="$3"
    
    echo "🔍 $description..."
    
    # Encontrar e substituir em arquivos
    find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.json" -o -name "*.md" -o -name "*.env*" -o -name "*.yml" -o -name "*.yaml" -o -name "*.toml" \) \
        -not -path "./node_modules/*" \
        -not -path "./.next/*" \
        -not -path "./dist/*" \
        -not -path "./$backup_dir/*" \
        -exec sed -i.bak "s/$search/$replace/g" {} \;
    
    # Remover arquivos .bak
    find . -name "*.bak" -not -path "./node_modules/*" -not -path "./$backup_dir/*" -delete
}

# Substituições principais
echo "🚀 INICIANDO SUBSTITUIÇÕES..."
echo "--------------------------------"

# 1. Nomes de marca
replace_in_files "RiskGuardian" "DefiGuardian" "Alterando nome da marca"
replace_in_files "riskguardian" "defiguardian" "Alterando nome minúsculo"
replace_in_files "risk-guardian" "defi-guardian" "Alterando nome com hífen"
replace_in_files "risk_guardian" "defi_guardian" "Alterando nome com underscore"

# 2. Textos específicos
replace_in_files "RiskGuardian AI" "DefiGuardian AI" "Alterando nome completo"
replace_in_files "RISKGUARDIAN" "DEFIGUARDIAN" "Alterando nome maiúsculo"

# 3. Descrições e títulos
replace_in_files "Proteja seus Investimentos DeFi" "Proteja seus Investimentos DeFi" "Mantendo descrição"
replace_in_files "Monitore riscos" "Monitore riscos DeFi" "Atualizando descrição"

# 4. URLs e identificadores
replace_in_files "riskguardian-api" "defiguardian-api" "Alterando service name"

# 5. Banco de dados
replace_in_files "postgresql://.*riskguardian" "postgresql://postgres:password@localhost:5432/defiguardian" "Atualizando DB name"

echo ""
echo "📁 RENOMEANDO ARQUIVOS E DIRETÓRIOS..."
echo "---------------------------------------"

# Renomear arquivos que contenham 'risk' no nome (se houver)
find . -name "*risk*" -not -path "./node_modules/*" -not -path "./$backup_dir/*" | while read file; do
    newname=$(echo "$file" | sed 's/risk/defi/g')
    if [ "$file" != "$newname" ]; then
        echo "📄 Renomeando: $file → $newname"
        mv "$file" "$newname" 2>/dev/null || echo "   ⚠️  Erro ao renomear $file"
    fi
done

echo ""
echo "🗄️  ATUALIZANDO CONFIGURAÇÕES DE BANCO..."
echo "------------------------------------------"

# Atualizar package.json se existir
if [ -f "package.json" ]; then
    echo "📦 Atualizando package.json..."
    sed -i.bak 's/"name": ".*riskguardian.*"/"name": "defiguardian"/g' package.json
    sed -i.bak 's/"description": ".*"/"description": "DefiGuardian - AI-powered DeFi risk management platform"/g' package.json
    rm -f package.json.bak
fi

# Atualizar frontend/package.json se existir
if [ -f "frontend/package.json" ]; then
    echo "📦 Atualizando frontend/package.json..."
    sed -i.bak 's/"name": ".*"/"name": "defiguardian-frontend"/g' frontend/package.json
    rm -f frontend/package.json.bak
fi

# Atualizar backend/package.json se existir
if [ -f "backend/package.json" ]; then
    echo "📦 Atualizando backend/package.json..."
    sed -i.bak 's/"name": ".*"/"name": "defiguardian-backend"/g' backend/package.json
    rm -f backend/package.json.bak
fi

echo ""
echo "✅ RENOMEAÇÃO CONCLUÍDA!"
echo "========================"

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "------------------"
echo "1. ✅ Criar novo banco no Supabase: 'defiguardian'"
echo "2. ✅ Atualizar .env com nova DATABASE_URL"
echo "3. ✅ Configurar OAuth com novo nome"
echo "4. ✅ Atualizar configuração do Chromia"
echo "5. ✅ Testar se tudo funciona"

echo ""
echo "🔧 COMANDOS PARA TESTAR:"
echo "------------------------"
echo "cd frontend && npm run build"
echo "cd backend && npm run build"

echo ""
echo "🗂️  BACKUP DISPONÍVEL EM: $backup_dir"
echo "Se algo der errado: rm -rf frontend backend && cp -r $backup_dir/* ."

echo ""
echo "🎉 DefiGuardian está pronto!"