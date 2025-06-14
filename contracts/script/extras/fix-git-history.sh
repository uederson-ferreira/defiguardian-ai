#!/bin/bash

# =============================================================================
# 🔧 Fix Git History - RiskGuardian AI
# =============================================================================
# Remove unwanted files from git history (use with EXTREME caution)
# This will rewrite git history - coordinate with team members!
# =============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}🚨 DANGER ZONE - Git History Rewrite${NC}"
echo "===================================="
echo ""
echo -e "${YELLOW}⚠️  WARNING: This script will rewrite git history!${NC}"
echo -e "${YELLOW}⚠️  This is DESTRUCTIVE and cannot be easily undone!${NC}"
echo -e "${YELLOW}⚠️  Coordinate with team members before running!${NC}"
echo ""
echo -e "${RED}This will:${NC}"
echo "1. Remove large dependencies from all commits"
echo "2. Force push to remote (overwrite GitHub history)"
echo "3. Require all team members to re-clone the repository"
echo ""

# Multiple confirmations
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirm1
if [ "$confirm1" != "yes" ]; then
    echo "Operation cancelled. Good choice!"
    exit 0
fi

read -p "Are you REALLY sure? This will rewrite history! (type 'REWRITE'): " confirm2
if [ "$confirm2" != "REWRITE" ]; then
    echo "Operation cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}🔍 Analyzing repository before cleanup...${NC}"

# Backup current state
echo -e "${BLUE}📦 Creating backup...${NC}"
git bundle create riskguardian-backup-$(date +%Y%m%d-%H%M%S).bundle --all
echo -e "${GREEN}✅ Backup created${NC}"

# Show current repo size
echo -e "${BLUE}📏 Current repository size:${NC}"
du -sh . | grep -v ".git"
du -sh .git

echo ""
echo -e "${BLUE}🧹 Starting cleanup process...${NC}"

# Method 1: BFG Repo Cleaner (if available)
if command -v bfg &> /dev/null; then
    echo -e "${BLUE}Using BFG Repo Cleaner (recommended)${NC}"
    
    # Remove large files and folders
    bfg --delete-folders lib
    bfg --delete-folders node_modules
    bfg --delete-folders .next
    bfg --delete-folders dist
    bfg --delete-folders out
    bfg --delete-folders cache
    bfg --delete-folders coverage
    
    # Remove sensitive files
    bfg --delete-files .env
    bfg --delete-files "*.key"
    bfg --delete-files "*.pem"
    bfg --delete-files "secrets.json"
    
    # Clean up
    git reflog expire --expire=now --all && git gc --prune=now --aggressive

else
    # Method 2: git filter-branch (built-in but slower)
    echo -e "${YELLOW}BFG not found. Using git filter-branch (slower)${NC}"
    
    # Remove lib directory from all commits
    echo "Removing lib/ directory..."
    git filter-branch --force --index-filter \
        'git rm -r --cached --ignore-unmatch lib/' \
        --prune-empty --tag-name-filter cat -- --all
    
    # Remove node_modules
    echo "Removing node_modules/ directory..."
    git filter-branch --force --index-filter \
        'git rm -r --cached --ignore-unmatch node_modules/' \
        --prune-empty --tag-name-filter cat -- --all
    
    # Remove build artifacts
    for dir in .next dist out cache coverage; do
        echo "Removing $dir/ directory..."
        git filter-branch --force --index-filter \
            "git rm -r --cached --ignore-unmatch $dir/" \
            --prune-empty --tag-name-filter cat -- --all
    done
    
    # Remove sensitive files
    for file in .env .env.local secrets.json private.json; do
        echo "Removing $file..."
        git filter-branch --force --index-filter \
            "git rm --cached --ignore-unmatch $file" \
            --prune-empty --tag-name-filter cat -- --all
    done
    
    # Clean up
    rm -rf .git/refs/original/
    git reflog expire --expire=now --all
    git gc --prune=now --aggressive
fi

echo ""
echo -e "${BLUE}📏 Repository size after cleanup:${NC}"
du -sh .git

echo ""
echo -e "${GREEN}✅ Cleanup completed!${NC}"
echo ""
echo -e "${YELLOW}📤 Next steps:${NC}"
echo "1. Verify the cleanup worked: git log --oneline"
echo "2. Force push to GitHub: git push --force-with-lease origin main"
echo "3. Inform team members to re-clone the repository"
echo ""
echo -e "${RED}⚠️  Team members must run:${NC}"
echo "   rm -rf riskguardian-ai"
echo "   git clone https://github.com/YOUR_USERNAME/riskguardian-ai.git"
echo ""

# Ask about force push
read -p "Do you want to force push to GitHub now? (y/N): " push_confirm
if [[ $push_confirm =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}📤 Force pushing to GitHub...${NC}"
    
    # Get current branch
    CURRENT_BRANCH=$(git branch --show-current)
    
    # Force push with lease (safer than --force)
    if git push --force-with-lease origin $CURRENT_BRANCH; then
        echo -e "${GREEN}✅ Successfully pushed to GitHub!${NC}"
    else
        echo -e "${RED}❌ Push failed. You may need to use --force instead of --force-with-lease${NC}"
        echo "Manual command: git push --force origin $CURRENT_BRANCH"
    fi
else
    echo -e "${YELLOW}⚠️  Remember to push manually when ready:${NC}"
    echo "git push --force-with-lease origin $(git branch --show-current)"
fi

echo ""
echo -e "${GREEN}🎉 Git history cleanup completed!${NC}"
echo -e "${BLUE}💡 Don't forget to reinstall dependencies:${NC}"
echo "   cd contracts && ./install-deps.sh"
echo "   npm install (in frontend and backend folders)"