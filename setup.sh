#!/bin/bash

# 📧 Netlinkagencies Email Notifications Setup Script
# Gmail Configuration for netlinkagencies254@gmail.com

echo "🚀 Starting Gmail Email Setup..."
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Step 1: Install Dependencies
echo -e "${BLUE}Step 1: Installing npm dependencies...${NC}"
npm install nodemailer firebase-admin firebase-functions

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

# Step 3: Set Firebase Environment Variables
echo -e "${BLUE}Step 3: Setting Firebase Gmail Configuration...${NC}"
firebase functions:config:set gmail.password="iblk cwna kjup zlqd"

echo -e "${GREEN}✅ Gmail password configured!${NC}"

# Step 4: Deploy Functions
echo -e "${BLUE}Step 4: Deploying Cloud Functions...${NC}"
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Functions deployed successfully!${NC}"
else
    echo -e "${RED}❌ Deployment failed${NC}"
    exit 1
fi

# Step 5: Display Setup Instructions
echo -e "${GREEN}=========================================="
echo "✅ Gmail Setup Complete!"
echo "=========================================${NC}"
echo ""
echo -e "${GREEN}📧 Email Configuration:${NC}"
echo "   Sender: netlinkagencies254@gmail.com"
echo "   Service: Gmail"
echo "   Status: ✅ Active"
echo ""
echo -e "${BLUE}🧪 Test Your Setup:${NC}"
echo "   1. Go to Firebase Console"
echo "   2. Open Firestore → users collection"
echo "   3. Change a user's status from 'pending' to 'active'"
echo "   4. Check the email within 30 seconds!"
echo ""
echo -e "${BLUE}📊 Monitor Emails:${NC}"
echo "   Run: firebase functions:log --limit 50"
echo ""
echo -e "${GREEN}📧 All email types ready:${NC}"
echo "   ✅ Account Activation"
echo "   💰 Task Earnings"
echo "   🚀 New Referrals"
echo "   🎁 Level 2 & 3 Bonuses"
echo "   💳 Withdrawal Processing"
echo ""
echo -e "${BLUE}Need help? Check GMAIL_SETUP.md${NC}"
