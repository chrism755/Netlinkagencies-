@echo off
REM 📧 Netlinkagencies Email Notifications Setup Script (Windows)
REM This script automatically installs dependencies and configures SendGrid

echo.
echo 🚀 Starting Email Notifications Setup...
echo ==========================================
echo.

REM Step 1: Install Dependencies
echo Step 1: Installing npm dependencies...
call npm install @sendgrid/mail firebase-admin firebase-functions

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully!
echo.

REM Step 2: Check Firebase CLI
echo Step 2: Checking Firebase CLI...
call firebase --version

if %errorlevel% neq 0 (
    echo ⚠️  Firebase CLI not found. Installing globally...
    call npm install -g firebase-tools
)

echo.

REM Step 3: Firebase Status
echo Step 3: Firebase project status...
call firebase projects:list

echo.
echo ==========================================
echo ✅ Setup Complete! Next Steps:
echo ==========================================
echo.
echo 1. Get your SendGrid API Key:
echo    - Go to https://sendgrid.com
echo    - Sign up or log in
echo    - Settings ^> API Keys
echo    - Copy your API key (starts with SG.)
echo.
echo 2. Set Firebase Environment Variables:
echo    Run this command (replace with your actual API key):
echo.
echo    firebase functions:config:set sendgrid.api_key="SG.YOUR-API-KEY-HERE" sendgrid.from_email="noreply@netlinkagencies.com"
echo.
echo 3. Deploy Cloud Functions:
echo    Run this command:
echo.
echo    firebase deploy --only functions
echo.
echo 4. Verify Setup:
echo    Run this command to see logs:
echo.
echo    firebase functions:log --limit 50
echo.
echo ==========================================
echo 📧 All email types ready to send:
echo ==========================================
echo   ✅ Account Activation
echo   💰 Task Earnings
echo   🚀 New Referrals
echo   🎁 Level 2 ^& 3 Bonuses
echo   💳 Withdrawal Processing
echo.
echo Need help? Check SETUP_INSTRUCTIONS.md
echo.
pause
