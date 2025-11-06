#!/bin/bash
# Test script for interactive setup.sh
# Simulates different user scenarios

set -e

FRAMEWORK_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
TEST_BASE_DIR="$HOME/Projects/test-automations"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

tests_passed=0
tests_failed=0

test_scenario() {
    local scenario_name="$1"
    local answers="$2"
    local test_dir="${TEST_BASE_DIR}/test-${scenario_name}-$(date +%s)"
    
    echo -e "\n${YELLOW}🧪 Testing: ${scenario_name}${NC}"
    echo "   Directory: ${test_dir}"
    
    mkdir -p "$test_dir"
    cd "$test_dir"
    
    # Create input file with answers
    echo "$answers" > /tmp/test-input.txt
    
    # Run setup.sh with input redirection
    if bash "$FRAMEWORK_ROOT/setup.sh" < /tmp/test-input.txt > /tmp/test-output.log 2>&1; then
        echo -e "${GREEN}✅ Setup completed${NC}"
        
        # Verify results based on scenario
        case "$scenario_name" in
            "docs-only")
                if [ ! -f "package.json" ]; then
                    echo -e "${GREEN}✅ package.json correctly not created${NC}"
                    ((tests_passed++))
                else
                    echo -e "${RED}❌ package.json should not exist${NC}"
                    ((tests_failed++))
                fi
                ;;
            "rules-mcp")
                if [ -f "package.json" ]; then
                    if grep -q "@modelcontextprotocol/sdk" package.json; then
                        echo -e "${GREEN}✅ package.json created with MCP dependency${NC}"
                        ((tests_passed++))
                    else
                        echo -e "${RED}❌ package.json missing MCP dependency${NC}"
                        ((tests_failed++))
                    fi
                else
                    echo -e "${RED}❌ package.json should exist${NC}"
                    ((tests_failed++))
                fi
                ;;
            "full-setup")
                if [ -f "frontend/package.json" ] && [ -f "package.json" ]; then
                    if grep -q "@modelcontextprotocol/sdk" package.json; then
                        echo -e "${GREEN}✅ Full setup completed correctly${NC}"
                        ((tests_passed++))
                    else
                        echo -e "${RED}❌ Root package.json missing MCP dependency${NC}"
                        ((tests_failed++))
                    fi
                else
                    echo -e "${RED}❌ Missing expected package.json files${NC}"
                    ((tests_failed++))
                fi
                ;;
        esac
        
        # Check for rules
        if [ -d ".cursor/rules" ]; then
            echo -e "${GREEN}✅ Rules directory created${NC}"
            ((tests_passed++))
        else
            echo -e "${RED}❌ Rules directory not created${NC}"
            ((tests_failed++))
        fi
        
    else
        echo -e "${RED}❌ Setup failed${NC}"
        echo "   Output:"
        tail -20 /tmp/test-output.log
        ((tests_failed++))
    fi
    
    # Cleanup
    cd "$FRAMEWORK_ROOT"
    rm -rf "$test_dir"
    rm -f /tmp/test-input.txt /tmp/test-output.log
}

# Test scenarios
echo "🚀 Testing Interactive Setup Scenarios"
echo "======================================"

# Scenario 1: Docs only (all no, no MCP)
test_scenario "docs-only" "
n
n
n
n
n
n
"

# Scenario 2: Rules + MCP only
test_scenario "rules-mcp" "
n
n
n
n
y
n
"

# Scenario 3: Full setup (Next.js + FastAPI + MCP + GitHub + Cloudflare)
test_scenario "full-setup" "
y
y
y
test-project
1
y

y
2
y
y
"

echo -e "\n${YELLOW}======================================"
echo -e "📊 Test Results:${NC}"
echo -e "${GREEN}✅ Passed: ${tests_passed}${NC}"
echo -e "${RED}❌ Failed: ${tests_failed}${NC}"
echo -e "${YELLOW}======================================${NC}\n"

exit $tests_failed

