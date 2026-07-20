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

# --- 2. Check for Package Manager / Runtime ---
HAS_NPM=false
HAS_BUN=false

if command -v npm >/dev/null 2>&1; then
    HAS_NPM=true
fi

if command -v bun >/dev/null 2>&1; then
    HAS_BUN=true
fi

# --- 3. Execute Global Installation ---
echo -e "Installing ${CYAN}gbam-dev${NC} globally..."

if [ "$HAS_BUN" = true ]; then
    echo "Using Bun package manager..."
    bun install -g gbam-dev
elif [ "$HAS_NPM" = true ]; then
    echo "Using npm package manager..."
    npm install -g gbam-dev
else
    echo -e "${RED}Error: Neither Node.js (npm) nor Bun was found on your system.${NC}"
    echo "Please install Node.js from https://nodejs.org and run this script again."
    exit 1
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
    echo -e "${RED}Installation complete, but 'gbam' command was not found in your current PATH.${NC}"
    echo "Please restart your terminal or ensure your global npm/bun bin directory is in your PATH."
fi