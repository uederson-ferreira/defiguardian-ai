#!/bin/bash

# =============================================================================
# 🔍 RiskGuardian AI - Check GitHub Status
# =============================================================================
# Verifica se as dependências foram enviadas para o GitHub
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking GitHub Status - RiskGuardian AI${NC}"
echo "============================================="
echo ""

# 1. Check what's currently tracked by git
echo -e "${BLUE}📋 Files currently tracked by Git:${NC}"
echo "-----------------------------------"

# Check for problematic directories that shouldn't be in git
PROBLEMATIC_DIRS=("lib" "node_modules" "dist" "build" ".next" "out" "cache" "coverage")
FOUND_ISSUES=0

for dir in "${PROBLEMATIC_DIRS[@]}"; do
    if git ls-files | grep -q "^$dir/"; then
        echo -e "${RED}❌ $dir/ is being tracked (SHOULDN'T BE!)${NC}"
        ((FOUND_ISSUES++))
    else
        echo -e "${GREEN}✅ $dir/ is not tracked${NC}"
    fi
done

echo ""

# 2. Check for environment files
echo -e "${BLUE}🔐 Environment & Secret Files:${NC}"
echo "------------------------------"

SECRET_FILES=(".env" ".env.local" "secrets.json" "private.json" "*.key" "*.pem")
for file in "${SECRET_FILES[@]}"; do
    if git ls-files | grep -q "$file"; then
        echo -e "${RED}❌ $file is being tracked (SECURITY RISK!)${NC}"
        ((FOUND_ISSUES++))
    else
        echo -e "${GREEN}✅ $file is not tracked${NC}"
    fi
done

echo ""

# 3. Check for large/binary files
echo -e "${BLUE}📊 Large Files (>1MB):${NC}"
echo "---------------------"
git ls-files | xargs du -sh 2>/dev/null | sort -hr | head -10

echo ""

# 4. Check repository size
echo -e "${BLUE}📏 Repository Size:${NC}"
echo "------------------"
REPO_SIZE=$(du -sh .git 2>/dev/null | cut -f1)
echo "Git directory size: $REPO_SIZE"

# Check if there are any contracts/lib files
if git ls-files | grep -q "lib/"; then
    LIB_COUNT=$(git ls-files | grep "lib/" | wc -l)
    echo -e "${RED}⚠️  Found $LIB_COUNT files in lib/ directory${NC}"
    echo "These are likely Foundry dependencies that shouldn't be committed"
fi

echo ""

# 5. Show recent commits
echo -e "${BLUE}📝 Recent Commits:${NC}"
echo "-----------------"
git log --oneline -5

echo ""

# 6. Check current branch and remote
echo -e "${BLUE}🌿 Git Status:${NC}"
echo "-------------"
echo "Current branch: $(git branch --show-current)"
echo "Remote URL: $(git remote get-url origin 2>/dev/null || echo 'No remote set')"
echo "Last push: $(git log --format='%H %s' --max-count=1 --branches --remotes)"

echo ""

# 7. Summary
if [ $FOUND_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 No issues found! Your repository looks clean.${NC}"
else
    echo -e "${RED}⚠️  Found $FOUND_ISSUES potential issues that need attention.${NC}"
    echo ""
    echo -e "${YELLOW}💡 Recommended actions:${NC}"
    echo "1. Add missing items to .gitignore"
    echo "2. Remove tracked files that shouldn't be there"
    echo "3. Use git filter-branch for sensitive data"
fi

echo ""
echo -e "${BLUE}🔗 Quick GitHub Check:${NC}"
echo "--------------------"
echo "Visit your GitHub repository and check if you see:"
echo "❌ lib/ folder (Foundry dependencies) - shouldn't be there"
echo "❌ node_modules/ folder - shouldn't be there"  
echo "❌ .env files - SECURITY RISK if present"
echo "✅ src/ folder with your contracts - should be there"
echo "✅ README.md, package.json, etc. - should be there"