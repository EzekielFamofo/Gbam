#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -euo pipefail

# --- Color Formatting ---
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${CYAN}${BOLD}"
echo "  ⚡ GBAM CLI Installer"
echo "  The Terminal AI Assistant You Pay for Only When You Code."
echo -e "${NC}\n"

# --- 1. OS & Architecture Detection ---
OS="$(uname -s)"
ARCH="$(uname -m)"

case "${OS}" in
    Linux*)     PLATFORM="Linux";;
    Darwin*)    PLATFORM="macOS";;
    *)          PLATFORM="UNKNOWN:${OS}";;
esac

echo -e "Detecting system... ${BOLD}${PLATFORM} (${ARCH})${NC}"

if [ "${PLATFORM}" = "UNKNOWN:${OS}" ]; then
    echo -e "${RED}Error: Unsupported operating system ${OS}.${NC}"
    exit 1
fi

# --- 2. Check for Package Manager / Runtime (Auto-install Bun if missing) ---
HAS_NPM=false
HAS_BUN=false

if command -v bun >/dev/null 2>&1; then
    HAS_BUN=true
elif command -v npm >/dev/null 2>&1; then
    HAS_NPM=true
else
    echo -e "${CYAN}No Node.js or Bun detected. Auto-installing Bun runtime...${NC}"
    curl -fsSL https://bun.sh/install | bash
    
    # Export Bun to the current script session's PATH
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
    
    if command -v bun >/dev/null 2>&1; then
        HAS_BUN=true
        echo -e "${GREEN}✓ Bun installed successfully.${NC}"
    else
        echo -e "${RED}Error: Failed to auto-install Bun. Please install Node.js or Bun manually.${NC}"
        exit 1
    fi
fi

# --- 3. Execute Global Installation ---
echo -e "Installing ${CYAN}gbam-dev${NC} globally..."

if [ "$HAS_BUN" = true ]; then
    echo "Using Bun package manager..."
    bun install -g gbam-dev
elif [ "$HAS_NPM" = true ]; then
    echo "Using npm package manager..."
    npm install -g gbam-dev
fi

# --- 4. Verify Installation & Output Guidance ---
echo ""
if command -v gbam >/dev/null 2>&1; then
    VERSION=$(gbam --version 2>/dev/null || echo "latest")
    echo -e "${GREEN}${BOLD}✓ GBAM CLI installed successfully! (${VERSION})${NC}\n"
    echo -e "Get started by running:"
    echo -e "  ${CYAN}gbam login${NC}"
    echo -e "  ${CYAN}gbam${NC}\n"
else
    echo -e "${GREEN}Installation complete!${NC}"
    echo -e "Please restart your terminal or run: ${CYAN}source ~/.bashrc${NC} (or ${CYAN}source ~/.zshrc${NC})"
    echo -e "Then run: ${CYAN}gbam login${NC}"
fi