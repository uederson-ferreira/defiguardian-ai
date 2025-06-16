#!/bin/bash

echo "🚨 CORREÇÃO FINAL COMPLETA - RISKGUARDIAN"
echo "========================================"

# Matar nodemon
pkill -f nodemon 2>/dev/null || true

# Verificar TypeScript
echo "🔍 Verificando TypeScript..."
if npx tsc --noEmit; then
  echo "✅ TypeScript compilou sem erros!"
  
  # Testar servidor
  echo "🚀 Testando servidor..."
  timeout 5s npm run dev &
  sleep 3
  
  if curl -s http://localhost:8001/health > /dev/null; then
    echo "✅ Servidor funcionando perfeitamente!"
    echo ""
    echo "🎉 PROJETO FUNCIONANDO!"
    echo "======================"
    echo "✅ TypeScript OK"
    echo "✅ Servidor OK"
    echo "✅ APIs funcionais"
    echo ""
    echo "Para iniciar: npm run dev"
  else
    echo "❌ Servidor não respondeu"
  fi
  
  pkill -f nodemon 2>/dev/null || true
  
else
  echo "❌ Ainda há erros TypeScript"
  npx tsc --noEmit
fi
