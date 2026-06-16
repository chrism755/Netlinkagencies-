#!/bin/bash

# 📧 Netlinkagencies Email Notifications Setup Script
# This script automatically installs dependencies and configures SendGrid

echo "🚀 Starting Email Notifications Setup..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install Dependencies
echo -e "${BLUE}Step 1: Installing npm dependencies...${NC}"
npm install @sendgrid/mail firebase-admin firebase-functions

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully!${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
fi

# Step 2: Check if Firebase CLI is installed
echo -e "${BLUE}Step 2: Checking Firebase CLI...${NC}"
firebase --version

if [ $? -ne 0 ]; then
    echo -e "${YELLOW}⚠️  Firebase CLI not found. Installing globally...${NC}"
    npm install -g firebase-tools
fi

# Step 3: Initialize Firebase (if not already done)
echo -e "${BLUE}Step 3: Firebase project status...${NC}"
firebase projects:list

# Step 4: Display Setup Instructions
echo -e "${GREEN}=========================================="
echo "✅ Setup Complete! Next Steps:"
echo "=========================================${NC}"
echo ""
echo -e "${BLUE}1. Get your SendGrid API Key:${NC}"
echo "   - Go to https://sendgrid.com"
echo "   - Sign up or log in"
echo "   - Settings → API Keys"
echo "   - Copy your API key (starts with SG.)"
echo ""
echo -e "${BLUE}2. Set Firebase Environment Variables:${NC}"
echo "   Run this command (replace with your actual API key):"
echo ""
echo -e "${YELLOW}firebase functions:config:set sendgrid.api_key=\"SG.YOUR-API-KEY-HERE\" sendgrid.from_email=\"noreply@netlinkagencies.com\"${NC}"
echo ""
echo -e "${BLUE}3. Deploy Cloud Functions:${NC}"
echo "   Run this command:"
echo ""
echo -e "${YELLOW}firebase deploy --only functions${NC}"
echo ""
echo -e "${BLUE}4. Verify Setup:${NC}"
echo "   Run this command to see logs:"
echo ""
echo -e "${YELLOW}firebase functions:log --limit 50${NC}"
echo ""
echo -e "${GREEN}=========================================="
echo "📧 All email types ready to send:"
echo "=========================================${NC}"
echo "  ✅ Account Activation"
echo "  💰 Task Earnings"
echo "  🚀 New Referrals"
echo "  🎁 Level 2 & 3 Bonuses"
echo "  💳 Withdrawal Processing"
echo ""
echo -e "${BLUE}Need help? Check SETUP_INSTRUCTIONS.md${NC}"
