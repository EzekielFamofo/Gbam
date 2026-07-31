#!/usr/bin/env bash
set -euo pipefail

# --- Color Formatting ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ⚡ GBAM CLI Installer"
echo "  The Terminal AI Assistant You Pay for Only When You Code."
echo -e "${NC}\n"

# --- 1. System Check ---
OS="$(uname -s)"
case "${OS}" in
    Darwin*) PLATFORM="macOS";;
    Linux*)  PLATFORM="Linux";;
    *)       echo -e "${RED}install.sh supports macOS and Linux. On Windows, run: npm install -g gbam-dev${NC}"; exit 1;;
esac

echo -e "Detecting system... ${BOLD}${PLATFORM}${NC}"

# --- 2. Runtime Detection & Fallback ---
HAS_BUN=false
HAS_NPM=false

if command -v bun >/dev/null 2>&1; then
    HAS_BUN=true
elif command -v npm >/dev/null 2>&1; then
    HAS_NPM=true
else
    echo -e "${CYAN}No JS runtime detected. Auto-installing Bun...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if command -v bun >/dev/null 2>&1; then
        HAS_BUN=true
    else
        echo -e "${RED}Error: Failed to auto-install Bun. Please install Node.js or Bun manually.${NC}"
        exit 1
    fi
fi

# --- 3. Install GBAM Globally ---
echo -e "Installing ${CYAN}gbam-dev${NC} globally..."

if [ "$HAS_BUN" = true ]; then
    bun install -g gbam-dev
elif [ "$HAS_NPM" = true ]; then
    if ! npm install -g gbam-dev 2>/dev/null; then
        echo -e "${CYAN}Global npm install requires elevated privileges. Retrying with sudo...${NC}"
        sudo npm install -g gbam-dev
    fi
fi

# --- 4. Success Check ---
echo ""
if command -v gbam >/dev/null 2>&1; then
    echo -e "${GREEN}${BOLD}✓ GBAM CLI installed successfully!${NC}\n"
    echo -e "Get started by running:"
    echo -e "  ${CYAN}gbam${NC}"
else
    echo -e "${GREEN}${BOLD}✓ GBAM CLI installed!${NC}"
    echo -e "Please restart your terminal session, then run: ${CYAN}gbam${NC}"
fi