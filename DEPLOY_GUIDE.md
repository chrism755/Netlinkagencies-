# DEPLOYMENT GUIDE - Copy & Paste Only

## Step 1: Install Firebase CLI
Open PowerShell/Terminal and copy-paste this:
```
npm install -g firebase-tools
```
Wait for it to finish (takes 1-2 minutes)

---

## Step 2: Log In to Firebase
Copy-paste this:
```
firebase login
```
- A browser window will pop up
- Click "Allow"
- Come back and press ENTER

---

## Step 3: Initialize Firebase Project
Navigate to your project folder. Copy-paste:
```
firebase init functions
```
- When it asks "Which project", select: `netlink-agencies-6399e`
- When it asks about JavaScript, press ENTER
- When it asks about ESLint, type `N` and press ENTER
- Say yes (Y) when asked if you want to install dependencies

---

## Step 4: Check Your Files
Make sure these files exist in your project:
- ✅ `index.js` (Cloud Functions)
- ✅ `emailService.js` (Email templates)
- ✅ `config.js` (Your Gmail credentials)

If they're NOT there, the deployment will fail!

---

## Step 5: Install Email Package
Copy-paste this:
```
npm install nodemailer
```

---

## Step 6: DEPLOY!
Copy-paste this:
```
firebase deploy --only functions
```

Wait... this will take 3-5 minutes. You'll see green checkmarks when done.

---

## That's It! 🎉

Your emails are now LIVE! 

**When users:**
- ✅ Create account → Email sent
- ✅ Complete task → Email sent
- ✅ Withdraw money → Email sent

---

## Troubleshooting

**If you get errors:**
1. Make sure all 3 files exist (index.js, emailService.js, config.js)
2. Make sure config.js has your email and 16-char password with NO SPACES
3. Make sure you're in the right folder when you run commands

**Still stuck?** Share the exact error message and I'll help!
