# 📧 Email Notifications Setup - Complete Guide

## Overview

Your Netlinkagencies platform now has automated email notifications for:
- ✅ Account Activation
- 💰 Task Earnings
- 🚀 New Referrals & Level Bonuses (L1, L2, L3)
- 💳 Withdrawal Processing

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com
2. Click **Sign Up** and create a free account
3. Verify your email address
4. Create a **Sender Identity** (Settings → Sender Authentication)
   - Verify a single sender email (e.g., noreply@netlinkagencies.com or your domain)

### Step 2: Generate SendGrid API Key

1. Log into SendGrid dashboard
2. Go to **Settings → API Keys**
3. Click **Create API Key**
4. Name it: `Firebase Functions`
5. Select **Full Access** permissions
6. Click **Create & View** and **copy the key** (starts with `SG.`)
   - ⚠️ Save this securely - you'll only see it once!

### Step 3: Install NPM Dependencies

```bash
cd functions  # or your Firebase functions directory
npm install @sendgrid/mail
```

### Step 4: Deploy Files to Firebase

The following files are already configured and ready:
- ✅ `emailService.js` - Email templates and sending logic
- ✅ `index.js` - Cloud Functions that trigger emails

Just ensure they're in your `functions/` directory.

### Step 5: Set Firebase Environment Variables

Run this command in your project root:

```bash
firebase functions:config:set sendgrid.api_key="SG.your-actual-api-key-here" sendgrid.from_email="noreply@netlinkagencies.com"
```

**Replace:**
- `SG.your-actual-api-key-here` with your actual SendGrid API key
- `noreply@netlinkagencies.com` with your verified sender email

### Step 6: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You'll see:
```
✔  Deploy complete!

Function URL (onUserActivated): https://us-central1-xxxxx.cloudfunctions.net/onUserActivated
```

---

## ✅ Verify It's Working

### Test Account Activation Email

1. Create or activate a test user account
2. Change their status in Firestore from `pending` to `active`
3. Check the test email - you should receive the activation email within 30 seconds

### Check SendGrid Dashboard

1. Go to https://app.sendgrid.com
2. Navigate to **Mail Send → Overview**
3. You'll see all sent emails in real-time with delivery status

---

## 📋 Database Schema (Required Fields)

Make sure your Firestore has these collections and fields:

### Users Collection
```javascript
{
  userId: "user123",
  username: "john_doe",
  email: "john@example.com",  // ← Email address for notifications
  fullName: "John Doe",
  status: "active",            // ← "pending" or "active"
  referralCode: "INV123",      // ← Your unique referral code
  referredBy: "INV456",        // ← Referrer's code (if referred)
  balance: 1000,
  totalEarnings: 5000,
  referralEarnings: 2000,
  completedTasks: 15,
  l1Referrals: 5,              // ← Number of direct referrals
  l2Referrals: 2,              // ← Referrals from your referrals
  l3Referrals: 1               // ← One more level down
}
```

### Tasks Collection (for task earnings emails)
```javascript
{
  taskId: "task123",
  taskName: "Survey Task",     // ← Task name shown in email
  userId: "user123",           // ← User who completed it
  status: "completed",         // ← Change this to "completed" to trigger email
  reward: 50                   // ← Amount earned shown in email
}
```

### Withdrawals Collection (for withdrawal emails)
```javascript
{
  withdrawalId: "wd123",
  userId: "user123",
  amount: 500,                          // ← Amount shown in email
  method: "PayPal",                    // ← Payment method shown in email
  status: "processed",                 // ← Change to "processed" to trigger email
  createdAt: timestamp,
  processedAt: timestamp
}
```

---

## 📧 What Emails Users Receive

### 1️⃣ Account Activation
**Trigger:** User status changes from `pending` → `active`
**Recipient:** New user + referrers (L1, L2, L3)
**Example:** "Dear john_doe, your account has been successfully activated! 🎉"

### 2️⃣ Task Earnings
**Trigger:** Task status changes to `completed`
**Recipient:** User who completed the task
**Example:** "Congratulations! You have earned $50 from completing Survey Task!"

### 3️⃣ New Referral (L1)
**Trigger:** When a referred user activates their account
**Recipient:** The direct referrer (L1)
**Example:** "Great news! jane_doe just joined using your referral link! You earned $500"

### 4️⃣ Level 2 Bonus
**Trigger:** When an L1 referral completes a task
**Recipient:** L2 referrer
**Example:** "You received a Level 2 referral bonus of $200!"

### 5️⃣ Level 3 Bonus
**Trigger:** When an L2 referral completes a task
**Recipient:** L3 referrer
**Example:** "You received a Level 3 referral bonus of $100!"

### 6️⃣ Withdrawal Processed
**Trigger:** Withdrawal status changes to `processed`
**Recipient:** User requesting the withdrawal
**Example:** "Your withdrawal of $500 has been processed to PayPal"

---

## 🛠️ Troubleshooting

### Emails Not Sending?

#### 1. Check Firebase Logs
```bash
firebase functions:log --limit 50
```

Look for error messages. Common issues:
- `API key is invalid`
- `Invalid sender email`
- `User not found in database`

#### 2. Verify Configuration
```bash
firebase functions:config:get
```

Should show:
```
{
  "sendgrid": {
    "api_key": "SG.xxxxxx...",
    "from_email": "noreply@netlinkagencies.com"
  }
}
```

#### 3. Check SendGrid Dashboard
- Log in to https://app.sendgrid.com
- Go to **Mail Send → Overview**
- Look for failed emails
- Click on failed email to see reason

#### 4. Verify Sender Email
- Go to SendGrid **Settings → Sender Authentication**
- Make sure your sender email is verified (checkmark ✓)
- If not verified, click "Resend Verification Email"

#### 5. Check Firestore Security Rules
Make sure your Cloud Functions have permission to read user/task/withdrawal data:
```javascript
match /databases/{database}/documents {
  match /users/{document=**} {
    allow read, write: if request.auth != null;
  }
  match /tasks/{document=**} {
    allow read, write: if request.auth != null;
  }
  match /withdrawals/{document=**} {
    allow read, write: if request.auth != null;
  }
}
```

---

## 🔧 Customization

### Change Bonus Amounts

Edit `index.js` and change these values:

```javascript
const L1_BONUS = 500;  // Direct referral bonus
const L2_BONUS = 200;  // Second-level referral bonus
const L3_BONUS = 100;  // Third-level referral bonus
```

Then redeploy:
```bash
firebase deploy --only functions
```

### Customize Email Templates

Edit `emailService.js` and modify the `emailTemplates` object. For example:

```javascript
accountActivated: (username, email) => ({
  to: email,
  from: "support@netlinkagencies.com",  // Change sender
  subject: "Welcome ${username}! 🎉",   // Change subject
  html: `...`  // Edit HTML content
})
```

### Change Dashboard Link

Replace all instances of:
```
https://netlinkagencies.vercel.app/dashboard
```
with your actual dashboard URL.

---

## 🔒 Security Best Practices

1. **Never share your SendGrid API key** - Keep it in Firebase config only
2. **Rotate API keys periodically** - Generate new keys in SendGrid dashboard
3. **Monitor SendGrid account** - Check for unusual activity
4. **Enable API key restrictions** in SendGrid:
   - Go to Settings → API Keys
   - Click your key → Edit
   - Set restrictions to Mail Send only
5. **Use environment variables** - Never hardcode credentials

---

## 📱 Test Email Sending Locally

### Using Firebase Emulator

```bash
firebase emulators:start --only functions
```

Then trigger actions locally and watch emails in real-time.

### Manual Test

Create a test user in Firestore:
```javascript
{
  username: "test_user",
  email: "your-test-email@gmail.com",
  status: "pending",
  referralCode: "TEST123"
}
```

Update status to `active` and watch for the email!

---

## 📞 Support

### SendGrid Documentation
- https://docs.sendgrid.com/
- https://docs.sendgrid.com/for-developers/sending-email/quickstart-nodejs

### Firebase Cloud Functions
- https://firebase.google.com/docs/functions

### Common Issues
- API Key: https://docs.sendgrid.com/ui/account-and-settings/api-keys
- Sender Auth: https://docs.sendgrid.com/ui/account-and-settings/sender-authentication

---

## ✨ Next Steps

- [ ] Create SendGrid account
- [ ] Generate and save API key
- [ ] Verify sender email in SendGrid
- [ ] Install npm dependencies: `npm install @sendgrid/mail`
- [ ] Set Firebase config: `firebase functions:config:set ...`
- [ ] Deploy: `firebase deploy --only functions`
- [ ] Test with a real user
- [ ] Monitor SendGrid dashboard
- [ ] Customize email templates (optional)

---

**Last Updated:** June 16, 2026
**Version:** 1.0 - SendGrid Integration Ready
