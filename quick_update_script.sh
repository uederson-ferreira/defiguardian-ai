#!/bin/bash
# SCRIPT DE ATUALIZAÇÃO RÁPIDA DEFIGUARDIAN-AI
# Execute: curl -sSL https://gist.githubusercontent.com/... | bash
# OU copie e cole o código abaixo:

echo "🚀 ATUALIZANDO PARA DEFIGUARDIAN-AI..."

# 1. Atualizar Git Remote
git remote set-url origin https://github.com/uederson-ferreira/defiguardian-ai.git

# 2. Atualizar package.json files
sed -i.bak 's/"name": ".*riskguardian.*"/"name": "defiguardian-ai"/g' package.json
[ -f "frontend/package.json" ] && sed -i.bak 's/"name": ".*"/"name": "defiguardian-ai-frontend"/g' frontend/package.json
[ -f "backend/package.json" ] && sed -i.bak 's/"name": ".*"/"name": "defiguardian-ai-backend"/g' backend/package.json

# 3. Atualizar código fonte
find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v node_modules | xargs sed -i.bak 's/RiskGuardian/DefiGuardian/g'
find . -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v node_modules | xargs sed -i.bak 's/riskguardian/defiguardian/g'

# 4. Atualizar README
[ -f "README.md" ] && sed -i.bak 's/riskguardian-ai/defiguardian-ai/g' README.md
[ -f "README.md" ] && sed -i.bak 's/RiskGuardian/DefiGuardian/g' README.md

# 5. Atualizar .env files
[ -f ".env.local" ] && sed -i.bak 's/riskguardian/defiguardian/g' .env.local
[ -f "frontend/.env.local" ] && sed -i.bak 's/riskguardian/defiguardian/g' frontend/.env.local
[ -f "backend/.env" ] && sed -i.bak 's/riskguardian/defiguardian/g' backend/.env

# 6. Limpar arquivos backup
find . -name "*.bak" -delete

# 7. Commit e push
git add .
git commit -m "feat: rename project to defiguardian-ai

- Update repository name and all references
- Update package.json files  
- Update codebase from RiskGuardian to DefiGuardian
- Update GitHub remote URL"

git push origin main

echo "✅ PROJETO ATUALIZADO PARA DEFIGUARDIAN-AI!"
echo "🔗 GitHub: https://github.com/uederson-ferreira/defiguardian-ai"
echo "🏷️  Nome: DefiGuardian"
echo ""
echo "🧪 Teste agora:"
echo "cd frontend && npm run build && npm run dev"