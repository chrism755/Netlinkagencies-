# 🚀 Quick Start Guide - Email Notifications

## For Smartphone/Browser Users 📱

### Option 1: Use GitHub Codespaces (Recommended - Works on Phone!)

1. **Open your repo on GitHub**
   - Go to https://github.com/chrism755/Netlinkagencies-
   - Click green **Code** button
   - Click **Codespaces** tab
   - Click **Create codespace on main**

2. **Wait for Codespace to load** (1-2 minutes)

3. **In the terminal at the bottom, run:**
   ```bash
   node setup-helper.js
   ```

4. **Follow the prompts:**
   - Paste your SendGrid API key
   - Confirm sender email
   - Copy the Firebase commands that appear

5. **Run the Firebase commands:**
   ```bash
   firebase functions:config:set sendgrid.api_key="SG.your-key" sendgrid.from_email="noreply@netlinkagencies.com"
   firebase deploy --only functions
   ```

6. **Done! 🎉 Check your dashboard for active functions**

---

## For Desktop Users 💻

### Windows:
```bash
setup.bat
```

### Mac/Linux:
```bash
bash setup.sh
```

---

## ⚡ Super Quick (Copy-Paste Only)

If you just want the commands without the helper:

1. **Get API Key from SendGrid**
   - https://sendgrid.com → Settings → API Keys

2. **Copy and paste this command** (replace YOUR-KEY):
   ```bash
   npm install @sendgrid/mail && firebase functions:config:set sendgrid.api_key="SG.YOUR-KEY" sendgrid.from_email="noreply@netlinkagencies.com" && firebase deploy --only functions
   ```

3. **Done!** ✅

---

## 🔍 Verify It Works

Check the logs:
```bash
firebase functions:log --limit 50
```

You should see emails being sent when:
- User account activates
- Task is completed
- Withdrawal is processed
- Referral signs up

---

## 📧 Test It Manually

1. Go to Firebase Console
2. Find your `users` collection
3. Update a user's status from `pending` to `active`
4. Check the email within 30 seconds!

---

**Questions? Check SETUP_INSTRUCTIONS.md for detailed help** 📖
