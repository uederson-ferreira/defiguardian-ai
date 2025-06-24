#!/bin/bash
cd frontend

echo "🔍 Verificando quais componentes UI são realmente usados..."

# Lista de componentes UI para verificar
components=(
  "accordion" "alert-dialog" "aspect-ratio" "avatar" "breadcrumb" 
  "calendar" "carousel" "chart" "checkbox" "collapsible" "command"
  "context-menu" "drawer" "form" "hover-card" "input-otp" "menubar"
  "navigation-menu" "pagination" "popover" "radio-group" "resizable"
  "scroll-area" "skeleton" "slider" "switch" "table" "textarea"
  "toast" "toaster" "toggle-group" "toggle" "tooltip"
)

for comp in "${components[@]}"; do
  if grep -r "from.*$comp" . --exclude-dir=node_modules --exclude-dir=.next 2>/dev/null | grep -v "components/ui/$comp.tsx" >/dev/null; then
    echo "✅ $comp - EM USO"
  else
    echo "🗑️  $comp - PODE REMOVER"
  fi
done

echo ""
echo "🔍 Verificando componentes duplicados..."
if [ -f "components/wallet-modal.tsx" ] && [ -f "components/wallet-connection.tsx" ]; then
  echo "🗑️  wallet-modal.tsx - DUPLICADO (manter wallet-connection.tsx)"
fi

if [ -f "components/ui/use-mobile.tsx" ] && [ -f "hooks/use-mobile.tsx" ]; then
  echo "🗑️  components/ui/use-mobile.tsx - DUPLICADO (manter hooks/use-mobile.tsx)"
fi