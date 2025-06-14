#!/bin/bash

# =============================================================================
# 🧪 RiskGuardian AI - Fixed Contract Validation Script
# =============================================================================
# Robust version with better error handling and debugging
# =============================================================================

# Remove set -e for better error handling
set -u  # Exit on undefined variables

# Colors and emojis
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
SECURITY_ISSUES=0
WARNINGS=0

# Logging function
log() {
    echo "[$(date '+%H:%M:%S')] $1"
}

print_header() {
    echo ""
    echo "========================================"
    echo "  $1"
    echo "========================================"
    echo ""
}

print_step() {
    log "${BLUE}🔄 $1${NC}"
}

print_success() {
    log "${GREEN}✅ $1${NC}"
    ((TESTS_PASSED++))
}

print_warning() {
    log "${YELLOW}⚠️  $1${NC}"
    ((WARNINGS++))
}

print_error() {
    log "${RED}❌ $1${NC}"
    ((TESTS_FAILED++))
}

# =============================================================================
# Environment Checks with Error Handling
# =============================================================================

check_environment() {
    print_header "🔍 Environment Checks"
    
    local errors=0
    
    # Check current directory
    print_step "Checking current directory: $(pwd)"
    
    # Check for foundry.toml
    if [ -f "foundry.toml" ]; then
        print_success "foundry.toml found"
    else
        print_error "foundry.toml not found. Are you in the contracts directory?"
        ((errors++))
    fi
    
    # Check Foundry installation
    if command -v forge >/dev/null 2>&1; then
        local forge_version=$(forge --version 2>/dev/null | head -1 || echo "unknown")
        print_success "Foundry found: $forge_version"
    else
        print_error "Foundry not installed. Install: curl -L https://foundry.paradigm.xyz | bash"
        ((errors++))
    fi
    
    # Check src directory
    if [ -d "src" ]; then
        local contract_count=$(find src -name "*.sol" | wc -l | tr -d ' ')
        print_success "Source directory found with $contract_count .sol files"
    else
        print_error "src directory not found"
        ((errors++))
    fi
    
    # Check Anvil (non-blocking)
    print_step "Testing Anvil connection..."
    if timeout 5s curl -s -X POST \
        -H "Content-Type: application/json" \
        -d '{"method":"eth_blockNumber","params":[],"id":1,"jsonrpc":"2.0"}' \
        http://localhost:8545 >/dev/null 2>&1; then
        print_success "Anvil blockchain is running"
        export ANVIL_RUNNING=true
    else
        print_warning "Anvil not running - some tests will be skipped"
        export ANVIL_RUNNING=false
    fi
    
    # Check/set private key
    if [ -z "${PRIVATE_KEY:-}" ]; then
        print_warning "PRIVATE_KEY not set. Using default development key."
        export PRIVATE_KEY="0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
    else
        print_success "PRIVATE_KEY is configured"
    fi
    
    # Check Node.js (optional)
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node --version 2>/dev/null || echo "unknown")
        print_success "Node.js found: $node_version"
        export NODE_AVAILABLE=true
    else
        print_warning "Node.js not available - some features will be skipped"
        export NODE_AVAILABLE=false
    fi
    
    if [ $errors -gt 0 ]; then
        print_error "Environment check failed with $errors critical errors"
        return 1
    else
        print_success "Environment checks completed successfully"
        return 0
    fi
}

# =============================================================================
# Code Quality Checks
# =============================================================================

run_code_formatting() {
    print_header "📝 Code Formatting"
    
    if ! command -v forge >/dev/null 2>&1; then
        print_error "Forge not available for formatting"
        return 1
    fi
    
    print_step "Checking code formatting..."
    if forge fmt --check >/dev/null 2>&1; then
        print_success "Code is properly formatted"
    else
        print_warning "Code formatting issues found. Applying fixes..."
        if forge fmt; then
            print_success "Code formatting applied successfully"
        else
            print_error "Failed to apply code formatting"
            return 1
        fi
    fi
}

check_compilation() {
    print_header "🔨 Compilation Tests"
    
    if ! command -v forge >/dev/null 2>&1; then
        print_error "Forge not available for compilation"
        return 1
    fi
    
    print_step "Cleaning previous builds..."
    forge clean >/dev/null 2>&1 || print_warning "Clean command failed (may be expected)"
    
    print_step "Compiling contracts..."
    if forge build 2>build_errors.log; then
        print_success "All contracts compiled successfully"
        
        # Check for warnings
        local warning_count=$(grep -i "warning" build_errors.log 2>/dev/null | wc -l | tr -d ' ')
        if [ "$warning_count" -eq 0 ]; then
            print_success "No compilation warnings"
        else
            print_warning "$warning_count compilation warnings found"
        fi
        
        return 0
    else
        print_error "Compilation failed"
        if [ -f build_errors.log ]; then
            echo "Compilation errors:"
            cat build_errors.log
        fi
        return 1
    fi
}

# =============================================================================
# Unit Tests
# =============================================================================

run_unit_tests() {
    print_header "🧪 Unit Tests"
    
    if ! command -v forge >/dev/null 2>&1; then
        print_error "Forge not available for testing"
        return 1
    fi
    
    print_step "Running unit tests..."
    if forge test --gas-report >test_results.log 2>&1; then
        local test_count=$(grep -c "✓" test_results.log 2>/dev/null || echo "0")
        print_success "All unit tests passed ($test_count tests)"
    else
        print_error "Some unit tests failed"
        if [ -f test_results.log ]; then
            echo "Test failures:"
            grep -A 3 "FAIL" test_results.log | head -20
        fi
        return 1
    fi
    
    # Test individual contracts if they exist
    local contracts=("RiskRegistryTest" "PortfolioRiskAnalyzerTest" "RiskInsuranceTest")
    for contract in "${contracts[@]}"; do
        print_step "Testing $contract..."
        if forge test --match-contract "$contract" >/dev/null 2>&1; then
            print_success "$contract tests passed"
        else
            print_warning "$contract tests failed or not found"
        fi
    done
}

# =============================================================================
# Basic Security Checks
# =============================================================================

run_security_checks() {
    print_header "🔐 Basic Security Checks"
    
    if [ ! -d "src" ]; then
        print_error "Source directory not found"
        return 1
    fi
    
    print_step "Checking security patterns..."
    
    # Check for reentrancy protection
    if grep -r "ReentrancyGuard\|nonReentrant" src/ >/dev/null 2>&1; then
        print_success "Reentrancy protection found"
    else
        print_warning "No reentrancy protection detected"
        ((SECURITY_ISSUES++))
    fi
    
    # Check for access controls
    if grep -r "onlyOwner\|onlyRole\|require.*msg.sender" src/ >/dev/null 2>&1; then
        print_success "Access controls implemented"
    else
        print_warning "Limited access controls found"
        ((SECURITY_ISSUES++))
    fi
    
    # Check for input validation
    if grep -r "require\|revert" src/ >/dev/null 2>&1; then
        print_success "Input validation implemented"
    else
        print_warning "Limited input validation found"
        ((SECURITY_ISSUES++))
    fi
    
    # Check for pausable functionality
    if grep -r "Pausable\|pause\|unpause" src/ >/dev/null 2>&1; then
        print_success "Emergency pause functionality found"
    else
        print_warning "No emergency pause functionality"
    fi
    
    # Check Solidity version
    if grep -r "pragma solidity.*0\.8" src/ >/dev/null 2>&1; then
        print_success "Using Solidity 0.8+ (built-in overflow protection)"
    else
        print_warning "Older Solidity version detected"
        ((SECURITY_ISSUES++))
    fi
}

# =============================================================================
# Gas Analysis
# =============================================================================

run_gas_analysis() {
    print_header "⛽ Gas Analysis"
    
    if ! command -v forge >/dev/null 2>&1; then
        print_warning "Forge not available for gas analysis"
        return 0
    fi
    
    print_step "Generating gas report..."
    if forge test --gas-report >gas_report.log 2>&1; then
        print_success "Gas report generated"
        
        # Look for high gas usage functions
        if grep -q "gas:" gas_report.log; then
            print_success "Gas usage data collected"
        fi
        
        # Create gas snapshot
        if forge snapshot >/dev/null 2>&1; then
            print_success "Gas snapshot created"
        fi
    else
        print_warning "Gas analysis failed"
    fi
}

# =============================================================================
# Integration Test
# =============================================================================

run_integration_test() {
    print_header "🔗 Integration Test"
    
    if [ "$ANVIL_RUNNING" != "true" ]; then
        print_warning "Skipping integration tests - Anvil not running"
        return 0
    fi
    
    if ! command -v forge >/dev/null 2>&1; then
        print_warning "Forge not available for integration tests"
        return 0
    fi
    
    print_step "Testing contract deployment..."
    if forge script script/Deploy.s.sol:DeployRiskGuardian \
        --rpc-url http://localhost:8545 \
        --broadcast \
        --private-key "$PRIVATE_KEY" \
        >/dev/null 2>&1; then
        print_success "Contract deployment test passed"
    else
        print_warning "Contract deployment test failed"
    fi
}

# =============================================================================
# Final Report
# =============================================================================

generate_report() {
    print_header "📋 Validation Report"
    
    local total_checks=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    
    if [ $total_checks -gt 0 ]; then
        success_rate=$((TESTS_PASSED * 100 / total_checks))
    fi
    
    echo -e "${CYAN}🏗️ RiskGuardian AI - Contract Validation Summary${NC}"
    echo "=================================================="
    echo ""
    echo -e "${GREEN}✅ Checks Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Checks Failed: $TESTS_FAILED${NC}"
    echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
    echo -e "${RED}🚨 Security Issues: $SECURITY_ISSUES${NC}"
    echo -e "${BLUE}📊 Success Rate: $success_rate%${NC}"
    echo ""
    
    # Determine overall status
    if [ $TESTS_FAILED -eq 0 ] && [ $SECURITY_ISSUES -eq 0 ]; then
        echo -e "${GREEN}🎉 VALIDATION PASSED - Contracts are ready!${NC}"
        echo "PASSED" >validation_status.txt
    elif [ $TESTS_FAILED -eq 0 ] && [ $SECURITY_ISSUES -le 2 ]; then
        echo -e "${YELLOW}⚠️ VALIDATION PASSED WITH WARNINGS${NC}"
        echo "PASSED_WITH_WARNINGS" >validation_status.txt
    else
        echo -e "${RED}❌ VALIDATION FAILED - Fix issues before deployment${NC}"
        echo "FAILED" >validation_status.txt
    fi
    
    echo ""
    echo -e "${BLUE}📁 Generated Files:${NC}"
    [ -f test_results.log ] && echo "  📊 test_results.log - Test results"
    [ -f gas_report.log ] && echo "  ⛽ gas_report.log - Gas analysis"
    [ -f build_errors.log ] && echo "  🔨 build_errors.log - Build output"
    [ -f validation_status.txt ] && echo "  ✅ validation_status.txt - Final status"
}

# =============================================================================
# Main Execution
# =============================================================================

main() {
    local start_time=$(date +%s)
    
    print_header "🚀 RiskGuardian AI - Contract Validation"
    
    echo "Starting validation process..."
    echo "Current directory: $(pwd)"
    echo "Current time: $(date)"
    echo ""
    
    # Run validation steps with error handling
    local steps=(
        "check_environment"
        "run_code_formatting" 
        "check_compilation"
        "run_unit_tests"
        "run_security_checks"
        "run_gas_analysis"
        "run_integration_test"
    )
    
    for step in "${steps[@]}"; do
        print_step "Executing $step..."
        if ! $step; then
            print_warning "$step completed with issues"
        fi
        echo ""  # Add spacing between steps
    done
    
    # Generate final report
    generate_report
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    echo ""
    echo -e "${CYAN}⏱️ Total validation time: ${duration}s${NC}"
    echo -e "${CYAN}🏁 Validation completed at: $(date)${NC}"
    
    # Return appropriate exit code
    if [ -f validation_status.txt ]; then
        local status=$(cat validation_status.txt)
        case $status in
            "FAILED") return 1 ;;
            *) return 0 ;;
        esac
    fi
    
    return 0
}

# Handle command line arguments
case "${1:-full}" in
    "quick")
        echo "🏃 Running quick validation..."
        check_environment && check_compilation && run_unit_tests
        ;;
    "security")
        echo "🔐 Running security checks only..."
        check_environment && run_security_checks
        ;;
    "gas")
        echo "⛽ Running gas analysis only..."
        check_environment && check_compilation && run_gas_analysis
        ;;
    "debug")
        echo "🐛 Running debug mode..."
        set -x
        main
        ;;
    *)
        main
        ;;
esac