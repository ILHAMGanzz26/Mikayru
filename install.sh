#!/bin/bash
# ==========================================
#  Mikayru Instalasi Module
#  Node.js 22 + PM2 Auto Run & Logs
#  Author : ILHAM A. / ILHAMGanz
# ==========================================

RED="\e[91m"
GREEN="\e[92m"
YELLOW="\e[93m"
BLUE="\e[94m"
MAGENTA="\e[95m"
CYAN="\e[96m"
NC="\e[0m"

clear
echo -e "${CYAN}"
cat << "EOF"
 ███▄ ▄███▓ ██▓ ██ ▄█▀ ▄▄▄     ▓██   ██▓ ██▀███   █    ██ 
▓██▒▀█▀ ██▒▓██▒ ██▄█▒ ▒████▄    ▒██  ██▒▓██ ▒ ██▒ ██  ▓██▒
▓██    ▓██░▒██▒▓███▄░ ▒██  ▀█▄   ▒██ ██░▓██ ░▄█ ▒▓██  ▒██░
▒██    ▒██ ░██░▓██ █▄ ░██▄▄▄▄██  ░ ▐██▓░▒██▀▀█▄  ▓▓█  ░██░
▒██▒   ░██▒░██░▒██▒ █▄ ▓█   ▓██▒ ░ ██▒▓░░██▓ ▒██▒▒▒█████▓ 
░ ▒░   ░  ░░▓  ▒ ▒▒ ▓▒ ▒▒   ▓▒█░  ██▒▒▒ ░ ▒▓ ░▒▓░░▒▓▒ ▒ ░
░  ░      ░ ▒ ░░ ░▒ ▒░  ▒   ▒▒ ░▓██ ░▒░   ░▒ ░ ▒░░░▒░ ░ ░
░      ░    ▒ ░░ ░░ ░   ░   ▒   ▒ ▒ ░░    ░░   ░  ░░░ ░ ░
       ░    ░  ░  ░         ░  ░░ ░        ░        ░    
                                  ░ ░                   
EOF
echo -e "${NC}"

sleep 1
echo -e "${MAGENTA}[ SYSTEM ] Initializing environment...${NC}"

# ==========================================
# Update system
# ==========================================
echo -e "${CYAN}[ SYSTEM ] Updating packages...${NC}"
apt update -y >/dev/null 2>&1
apt upgrade -y >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] System updated.${NC}"

# ==========================================
# Install system dependencies
# ==========================================
echo -e "${CYAN}[ SYSTEM ] Installing system dependencies...${NC}"
apt install -y \
  curl git unzip zip \
  build-essential python3 make g++ \
  libtool autoconf automake pkg-config liblzma-dev \
  ffmpeg imagemagick >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] Dependencies installed.${NC}"

# ==========================================
# Install Node.js 22
# ==========================================
echo -e "${CYAN}[ NODE ] Installing Node.js 22...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash - >/dev/null 2>&1
apt install -y nodejs >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] Node.js installed.${NC}"

# ==========================================
# Install PM2
# ==========================================
if ! command -v pm2 &>/dev/null; then
  echo -e "${CYAN}[ PM2 ] Installing PM2...${NC}"
  npm install -g pm2 >/dev/null 2>&1
  echo -e "${GREEN}[ DONE ] PM2 installed.${NC}"
else
  echo -e "${BLUE}[ PM2 ] PM2 already installed.${NC}"
fi

# ==========================================
# Bot setup
# ==========================================
BOT_DIR="/root/mikayru"
BOT_FILE="index.js"   # ganti sesuai entry file bot

if [ ! -d "$BOT_DIR" ]; then
  echo -e "${RED}[ ERROR ] Folder $BOT_DIR tidak ditemukan!${NC}"
  exit 1
fi

cd "$BOT_DIR"

# ==========================================
# Clean previous installs and session
# ==========================================
echo -e "${YELLOW}[ NPM ] Cleaning previous node_modules & package-lock...${NC}"
rm -rf node_modules package-lock.json

# Hapus folder auth / session
if [ -d "./auth" ]; then
  echo -e "${YELLOW}[ SESSION ] Removing existing session (auth folder)...${NC}"
  rm -rf ./auth
  echo -e "${GREEN}[ DONE ] Session removed.${NC}"
else
  echo -e "${BLUE}[ SESSION ] No auth folder found, skipping.${NC}"
fi

# ==========================================
# Install Baileys Itsuki first
# ==========================================
echo -e "${MAGENTA}[ NPM ] Installing Baileys Itsuki from GitHub...${NC}"
npm install github:Itsukichann/Baileys >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] Baileys installed.${NC}"

# ==========================================
# Install remaining npm dependencies
# ==========================================
echo -e "${MAGENTA}[ NPM ] Installing other dependencies...${NC}"
npm install >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] All npm dependencies installed.${NC}"

# ==========================================
# PM2 cleanup
# ==========================================
echo -e "${YELLOW}[ PM2 ] Deleting all previous processes to avoid conflict...${NC}"
pm2 delete all >/dev/null 2>&1

# ==========================================
# Start bot with PM2
# ==========================================
echo -e "${CYAN}[ PM2 ] Starting bot...${NC}"
pm2 start "$BOT_FILE" --name mikayru-bot
pm2 save >/dev/null 2>&1
echo -e "${GREEN}[ DONE ] Bot started with PM2.${NC}"

# ==========================================
# Show logs
# ==========================================
echo
echo -e "${MAGENTA}[ LOGS ] Showing live logs...${NC}"
sleep 1
pm2 logs mikayru-bot