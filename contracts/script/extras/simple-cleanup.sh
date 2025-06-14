#!/bin/bash

# =============================================================================
# 🧹 Simple Cleanup - RiskGuardian AI
# =============================================================================
# Safe method: Stop tracking unwanted files WITHOUT rewriting history
# This is the RECOMMENDED approach for most cases
# =============================================================================

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🧹 Safe Git Cleanup - RiskGuardian AI${NC}"
echo "===================================="
echo ""
echo -e "${GREEN}✅ This method is SAFE - it doesn't rewrite history${NC}"
echo -e "${BLUE}ℹ️  It will stop tracking files from the next commit forward${NC}"
echo ""

# 1. Ensure we have a good .gitignore
echo -e "${BLUE}📝 Step 1: Updating .gitignore${NC}"
if [ ! -f ".gitignore" ]; then
    echo -e "${YELLOW}⚠️  No .gitignore found. Creating one...${NC}"
    # Create a basic .gitignore (you should replace this with the complete one)
    cat > .gitignore << 'EOF'
# Dependencies
lib/
node_modules/

# Build outputs
dist/
build/
.next/
out/
cache/
coverage/

# Environment
.env
.env.local
.env.*.local

# Logs
*.log

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
EOF
    echo -e "${GREEN}✅ .gitignore created${NC}"
else
    echo -e "${GREEN}✅ .gitignore already exists${NC}"
fi

echo ""

# 2. Remove files from git tracking (but keep local files)
echo -e "${BLUE}🗂️  Step 2: Removing unwanted files from git tracking${NC}"

# List of directories/files to untrack
ITEMS_TO_UNTRACK=(
    "lib/"
    "node_modules/"
    ".next/"
    "dist/"
    "build/"
    "out/"
    "cache/"
    "coverage/"
    ".env"
    ".env.local"
    ".DS_Store"
    "Thumbs.db"
    "*.log"
    "secrets.json"
    "private.json"
)

for item in "${ITEMS_TO_UNTRACK[@]}"; do
    if git ls-files | grep -q "$item"; then
        echo -e "${YELLOW}📤 Removing $item from git tracking...${NC}"
        git rm -r --cached "$item" 2>/dev/null || git rm --cached "$item" 2>/dev/null || echo "   (not found or already removed)"
    else
        echo -e "${GREEN}✅ $item not being tracked${NC}"
    fi
done

echo ""

# 3. Show what will be committed
echo -e "${BLUE}📋 Step 3: Reviewing changes${NC}"
echo "Files to be removed from tracking:"
git status --porcelain | grep "^D" | head -20
if [ $(git status --porcelain | grep "^D" | wc -l) -gt 20 ]; then
    echo "... and $(( $(git status --porcelain | grep "^D" | wc -l) - 20 )) more files"
fi

echo ""

# 4. Commit the changes
echo -e "${BLUE}💾 Step 4: Committing changes${NC}"
read -p "Do you want to commit these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .gitignore
    git commit -m "🧹 Remove dependencies and build artifacts from tracking

- Stop tracking lib/ directory (Foundry dependencies)
- Stop tracking node_modules/ directory  
- Stop tracking build artifacts (dist/, build/, .next/, etc.)
- Stop tracking environment files and logs
- Updated .gitignore to prevent future tracking

This commit makes the repository cleaner and smaller.
Dependencies can be reinstalled with:
- contracts: ./install-deps.sh
- frontend/backend: npm install"

    echo -e "${GREEN}✅ Changes committed!${NC}"
    
    # Ask about pushing
    read -p "Do you want to push to GitHub? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git push
        echo -e "${GREEN}✅ Changes pushed to GitHub!${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Changes not committed. You can commit manually later.${NC}"
fi

echo ""

# 5. Show final status
echo -e "${BLUE}📊 Final Status:${NC}"
echo "Repository size: $(du -sh .git | cut -f1)"
echo "Files being tracked: $(git ls-files | wc -l)"
echo ""

# 6. Reinstall dependencies
echo -e "${BLUE}🔧 Step 5: Reinstalling dependencies${NC}"
echo "You'll need to reinstall dependencies:"
echo ""

if [ -f "contracts/foundry.toml" ]; then
    echo -e "${YELLOW}📦 For contracts (Foundry):${NC}"
    echo "   cd contracts"
    echo "   ./install-deps.sh"
    echo "   # OR manually:"
    echo "   forge install OpenZeppelin/openzeppelin-contracts --no-commit"
    echo "   forge install smartcontractkit/chainlink-brownie-contracts --no-commit"
    echo ""
fi

if [ -f "frontend/package.json" ]; then
    echo -e "${YELLOW}📦 For frontend:${NC}"
    echo "   cd frontend"
    echo "   npm install"
    echo ""
fi

if [ -f "backend/package.json" ]; then
    echo -e "${YELLOW}📦 For backend:${NC}"
    echo "   cd backend"
    echo "   npm install"
    echo ""
fi

echo -e "${GREEN}🎉 Cleanup completed successfully!${NC}"
echo ""
echo -e "${BLUE}📋 Summary:${NC}"
echo "✅ Unwanted files removed from git tracking"
echo "✅ .gitignore updated"
echo "✅ Repository is now cleaner"
echo "💡 Dependencies need to be reinstalled locally"
echo "🚀 Future commits will be much smaller"
echo ""
echo -e "${YELLOW}💡 For team members:${NC}"
echo "They need to run: git pull && npm install (in each directory)"