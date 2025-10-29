#!/bin/bash
# Rules Framework Interactive Setup Script
set -e

FRAMEWORK_URL="https://rules-framework.mikehenken.workers.dev"

# Color codes for better UX
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Helper function to prompt for yes/no with default
prompt_yes_no() {
    local prompt="$1"
    local default="$2"
    local response
    
    if [ "$default" = "yes" ]; then
        prompt="${prompt} [Y/n]: "
    else
        prompt="${prompt} [y/N]: "
    fi
    
    read -p "$prompt" response < /dev/tty
    response=${response:-$default}
    
    case "$response" in
        [Yy]|[Yy][Ee][Ss]|yes)
            echo "yes"
            ;;
        *)
            echo "no"
            ;;
    esac
}

# Helper function to prompt for input with default
prompt_input() {
    local prompt="$1"
    local default="$2"
    local response
    
    if [ -n "$default" ]; then
        read -p "${prompt} [${default}]: " response < /dev/tty
        echo "${response:-$default}"
    else
        read -p "${prompt}: " response < /dev/tty
        echo "$response"
    fi
}

# Helper function to prompt for choice
prompt_choice() {
    local prompt="$1"
    local default="$2"
    shift 2
    local options=("$@")
    local response
    
    echo "$prompt"
    for i in "${!options[@]}"; do
        local marker=""
        if [ "${options[$i]}" = "$default" ]; then
            marker=" (default)"
        fi
        echo "  $((i+1)). ${options[$i]}${marker}"
    done
    
    read -p "Enter choice [1-${#options[@]}]: " response < /dev/tty
    
    if [ -z "$response" ]; then
        echo "$default"
    else
        local index=$((response - 1))
        if [ "$index" -ge 0 ] && [ "$index" -lt "${#options[@]}" ]; then
            echo "${options[$index]}"
        else
            echo "$default"
        fi
    fi
}

echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║        🎯 Rules Framework Interactive Setup Wizard         ║${NC}"
echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
echo ""

# Get current directory name for default project name
CURRENT_DIR=$(basename "$PWD")

# ============================================================================
# PART 1: INTERACTIVE QUESTIONNAIRE
# ============================================================================

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Core Modules & Rules Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Question 1: Next.js frontend
ENABLE_NEXTJS=$(prompt_yes_no "Enable Next.js frontend?" "yes")

# Question 2: FastAPI backend
ENABLE_FASTAPI=$(prompt_yes_no "Enable FastAPI Python backend?" "yes")

# Question 3: Auto GitHub repo creation
ENABLE_GITHUB=$(prompt_yes_no "Enable auto GitHub repo creation?" "yes")

# Question 4: Cloudflare deployment
ENABLE_CLOUDFLARE=$(prompt_yes_no "Enable Cloudflare deployment?" "yes")

# Question 5: Rule granularity
ENABLE_GRANULAR_RULES=$(prompt_yes_no "Configure individual rule granularity?" "no")

echo ""

# ============================================================================
# CONDITIONAL: GitHub Configuration
# ============================================================================

if [ "$ENABLE_GITHUB" = "yes" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  GitHub Repository Configuration${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Prompt for project name
    REPO_NAME=$(prompt_input "Project name" "$CURRENT_DIR")
    
    # Prompt for repository visibility
    REPO_VISIBILITY=$(prompt_choice "Repository visibility:" "private" "private" "public")
    
    echo ""
fi

# ============================================================================
# CONDITIONAL: Cloudflare Configuration
# ============================================================================

if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  Cloudflare Deployment Configuration${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Prompt for Cloudflare API token
    echo -e "${YELLOW}⚠️  These values will be passed as environment variables${NC}"
    CLOUDFLARE_API_TOKEN=$(prompt_input "Cloudflare API Token" "")
    
    # Prompt for Cloudflare account ID
    CLOUDFLARE_ACCOUNT_ID=$(prompt_input "Cloudflare Account ID" "")
    
    # Prompt for deployment target
    CLOUDFLARE_TARGET=$(prompt_choice "Deployment target:" "Cloudflare Workers" "Cloudflare Workers" "Cloudflare Pages")
    
    echo ""
fi

# ============================================================================
# PART 2: DOWNLOAD FILES & PREPARE ENVIRONMENT
# ============================================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Downloading Framework Files...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Create .cursor directory
mkdir -p .cursor

# Download MCP server
echo "📥 Downloading MCP server..."
curl -s "${FRAMEWORK_URL}/files/mcp-server.js" > mcp-server.js

# Create MCP configuration
echo "⚙️  Creating MCP configuration..."
cat > .cursor/mcp.json << EOF
{
  "mcpServers": {
    "rules-framework": {
      "command": "node",
      "args": ["mcp-server.js"],
      "env": {
        "RULES_FRAMEWORK_URL": "${FRAMEWORK_URL}"
      }
    }
  }
}
EOF

# Download setup wizard
echo "📥 Downloading setup wizard..."
curl -s "${FRAMEWORK_URL}/files/setup-wizard.js" > setup-wizard.js

# Download package.json template
echo "📥 Downloading package.json..."
curl -s "${FRAMEWORK_URL}/files/package.template.json" > package.json

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent

echo ""

# ============================================================================
# PART 3: BUILD COMMAND-LINE ARGUMENTS & ENVIRONMENT VARIABLES
# ============================================================================

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  Starting Interactive Setup Wizard...${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Build command-line arguments
WIZARD_ARGS=()

if [ "$ENABLE_NEXTJS" = "yes" ]; then
    WIZARD_ARGS+=(--nextjs)
fi

if [ "$ENABLE_FASTAPI" = "yes" ]; then
    WIZARD_ARGS+=(--fastapi)
fi

if [ "$ENABLE_GITHUB" = "yes" ]; then
    WIZARD_ARGS+=(--github)
    WIZARD_ARGS+=(--repoName "$REPO_NAME")
    WIZARD_ARGS+=(--repoVisibility "$REPO_VISIBILITY")
fi

if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    WIZARD_ARGS+=(--cloudflare)
    WIZARD_ARGS+=(--cloudflareTarget "$CLOUDFLARE_TARGET")
    
    # Export environment variables for secrets
    export CLOUDFLARE_API_TOKEN
    export CLOUDFLARE_ACCOUNT_ID
fi

if [ "$ENABLE_GRANULAR_RULES" = "yes" ]; then
    WIZARD_ARGS+=(--granular-rules)
fi

# Execute the Node.js wizard with all arguments
node setup-wizard.js "${WIZARD_ARGS[@]}"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 Setup Complete! 🎉                         ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Display configuration summary
echo -e "${CYAN}Configuration Summary:${NC}"
echo -e "  Next.js Frontend: ${ENABLE_NEXTJS}"
echo -e "  FastAPI Backend: ${ENABLE_FASTAPI}"
echo -e "  GitHub Integration: ${ENABLE_GITHUB}"
if [ "$ENABLE_GITHUB" = "yes" ]; then
    echo -e "    - Repository Name: ${REPO_NAME}"
    echo -e "    - Visibility: ${REPO_VISIBILITY}"
fi
echo -e "  Cloudflare Deployment: ${ENABLE_CLOUDFLARE}"
if [ "$ENABLE_CLOUDFLARE" = "yes" ]; then
    echo -e "    - Target: ${CLOUDFLARE_TARGET}"
fi
echo -e "  Granular Rules: ${ENABLE_GRANULAR_RULES}"
echo ""

