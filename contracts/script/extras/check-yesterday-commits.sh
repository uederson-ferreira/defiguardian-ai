#!/bin/bash

# =============================================================================
# 📅 Check Yesterday's Commits - RiskGuardian AI
# =============================================================================
# Verifica exatamente o que foi commitado ontem
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}📅 Checking Yesterday's Commits${NC}"
echo "==============================="
echo ""

# Get yesterday's date
YESTERDAY=$(date -d "yesterday" "+%Y-%m-%d" 2>/dev/null || date -v-1d "+%Y-%m-%d" 2>/dev/null || echo "2024-01-01")
echo "Looking for commits from: $YESTERDAY"
echo ""

# Find commits from yesterday
echo -e "${BLUE}📝 Commits from yesterday:${NC}"
echo "--------------------------"
git log --since="$YESTERDAY 00:00" --until="$YESTERDAY 23:59" --oneline --all

echo ""

# Get detailed info about yesterday's commits
COMMIT_HASHES=$(git log --since="$YESTERDAY 00:00" --until="$YESTERDAY 23:59" --format="%H")

if [ -z "$COMMIT_HASHES" ]; then
    echo -e "${YELLOW}ℹ️  No commits found from exactly yesterday.${NC}"
    echo -e "${BLUE}📝 Showing last 5 commits instead:${NC}"
    git log --oneline -5
    COMMIT_HASHES=$(git log --format="%H" -5)
fi

echo ""

# Analyze each commit
for commit in $COMMIT_HASHES; do
    echo -e "${BLUE}🔍 Analyzing commit: ${commit:0:8}${NC}"
    echo "$(git log --format='%s' -1 $commit)"
    echo "Date: $(git log --format='%ad' -1 $commit)"
    echo ""
    
    echo -e "${BLUE}📁 Files changed in this commit:${NC}"
    git diff-tree --no-commit-id --name-only -r $commit | head -20
    
    echo ""
    
    # Check for problematic files in this commit
    echo -e "${BLUE}⚠️  Problematic files in this commit:${NC}"
    PROBLEMATIC_FOUND=0
    
    # Check for lib/ directory (Foundry dependencies)
    if git diff-tree --no-commit-id --name-only -r $commit | grep -q "^lib/"; then
        echo -e "${RED}❌ lib/ directory files (Foundry dependencies)${NC}"
        git diff-tree --no-commit-id --name-only -r $commit | grep "^lib/" | head -5
        if [ $(git diff-tree --no-commit-id --name-only -r $commit | grep "^lib/" | wc -l) -gt 5 ]; then
            echo "   ... and $(( $(git diff-tree --no-commit-id --name-only -r $commit | grep "^lib/" | wc -l) - 5 )) more files"
        fi
        ((PROBLEMATIC_FOUND++))
    fi
    
    # Check for node_modules
    if git diff-tree --no-commit-id --name-only -r $commit | grep -q "node_modules/"; then
        echo -e "${RED}❌ node_modules/ directory${NC}"
        ((PROBLEMATIC_FOUND++))
    fi
    
    # Check for environment files
    if git diff-tree --no-commit-id --name-only -r $commit | grep -E "\.(env|key|pem)$|secrets"; then
        echo -e "${RED}🚨 SECURITY: Environment/secret files detected!${NC}"
        git diff-tree --no-commit-id --name-only -r $commit | grep -E "\.(env|key|pem)$|secrets"
        ((PROBLEMATIC_FOUND++))
    fi
    
    # Check for build artifacts
    if git diff-tree --no-commit-id --name-only -r $commit | grep -E "^(dist|build|out|cache|coverage)/"; then
        echo -e "${YELLOW}⚠️  Build artifacts${NC}"
        git diff-tree --no-commit-id --name-only -r $commit | grep -E "^(dist|build|out|cache|coverage)/"
        ((PROBLEMATIC_FOUND++))
    fi
    
    # Check for large files
    echo -e "${BLUE}📊 Large files (>100KB) in this commit:${NC}"
    git diff-tree --no-commit-id --name-only -r $commit | xargs -I {} sh -c 'if [ -f "{}" ]; then size=$(wc -c < "{}"); if [ $size -gt 102400 ]; then echo "$(numfmt --to=iec $size) {}"; fi; fi' 2>/dev/null | head -5
    
    if [ $PROBLEMATIC_FOUND -eq 0 ]; then
        echo -e "${GREEN}✅ No obvious problems in this commit${NC}"
    else
        echo -e "${RED}⚠️  Found $PROBLEMATIC_FOUND types of problematic files${NC}"
    fi
    
    echo ""
    echo "----------------------------------------"
    echo ""
done

# Summary and recommendations
echo -e "${BLUE}📋 Summary & Recommendations:${NC}"
echo "=============================

echo ""
echo -e "${YELLOW}🔍 To check what's currently on GitHub:${NC}"
echo "1. Visit: https://github.com/YOUR_USERNAME/riskguardian-ai"
echo "2. Look for these RED FLAGS:"
echo "   ❌ lib/ folder (contains OpenZeppelin, Chainlink, etc.)"
echo "   ❌ node_modules/ folder"
echo "   ❌ .env files"
echo "   ❌ Large files (>10MB)"
echo ""
echo -e "${GREEN}✅ GOOD files to see:${NC}"
echo "   ✅ src/ folder with your .sol contracts"
echo "   ✅ test/ folder with tests"
echo "   ✅ script/ folder with deployment scripts"
echo "   ✅ README.md, package.json, foundry.toml"
echo ""

# Check current repository size
echo -e "${BLUE}📏 Current Repository Size:${NC}"
echo "---------------------------"
if [ -d ".git" ]; then
    REPO_SIZE=$(du -sh .git | cut -f1)
    echo "Local .git size: $REPO_SIZE"
    
    # If larger than 50MB, probably has dependencies
    REPO_SIZE_BYTES=$(du -s .git | cut -f1)
    if [ $REPO_SIZE_BYTES -gt 51200 ]; then  # 50MB in KB
        echo -e "${RED}⚠️  Repository is quite large - likely contains dependencies${NC}"
    else
        echo -e "${GREEN}✅ Repository size looks reasonable${NC}"
    fi
fi

echo ""
echo -e "${YELLOW}💡 If you found problems:${NC}"
echo "1. Run: ./fix-git-history.sh"
echo "2. Or follow the cleanup instructions below"