# 📧 Gmail Setup Guide - netlinkagencies254@gmail.com

## Quick Setup (3 Steps)

### Step 1: Create Google App Password

1. Go to https://myaccount.google.com
2. Click **Security** (left menu)
3. Enable **2-Step Verification** if not already enabled
4. Scroll down and click **App passwords**
5. Select:
   - Device: **Windows Computer** (or your device)
   - App: **Mail**
6. Google will generate a 16-character password
7. **COPY** this password and save it somewhere safe

Example: `abcd efgh ijkl mnop` (without spaces: `abcdefghijklmnop`)

---

### Step 2: Set Firebase Environment Variable

Run this command and **replace the password**:

```bash
firebase functions:config:set gmail.password="YOUR-16-CHARACTER-PASSWORD"
```

Example:
```bash
firebase functions:config:set gmail.password="abcdefghijklmnop"
```

---

### Step 3: Deploy Functions

```bash
firebase deploy --only functions
```

Wait for deployment to complete. You should see:
```
✔ Deploy complete!
```

---

## ✅ That's It! Emails Will Now Send From netlinkagencies254@gmail.com

---

## 🧪 Test It

1. Go to Firebase Console → Firestore
2. Find a user in your `users` collection
3. Change their status from `pending` to `active`
4. **Check the email within 30 seconds!**

You should receive:
- **From:** netlinkagencies254@gmail.com
- **Subject:** "Account Activated Successfully! 🎉"
- **To:** The user's email

---

## 📊 Monitor Emails

Check Firebase logs:
```bash
firebase functions:log --limit 50
```

You'll see:
```
✅ Email sent: accountActivated to user@example.com
```

---

## ❓ Troubleshooting

### Emails Not Sending?

1. **Check the password is correct**
   ```bash
   firebase functions:config:get
   ```
   Should show your gmail.password

2. **Check Firebase Logs**
   ```bash
   firebase functions:log --limit 50
   ```

3. **Common Error: "Invalid credentials"**
   - Verify you copied the 16-character App Password correctly
   - Make sure you turned ON 2-Step Verification
   - Try generating a new App Password

4. **Allow Less Secure Apps (if needed)**
   - Go to https://myaccount.google.com/lesssecureapps
   - Turn ON "Allow less secure app access"

---

## 🔒 Security Notes

✅ **Safe:**
- App passwords are separate from your main Gmail password
- You can revoke them anytime
- Firebase stores them securely

❌ **NOT Safe:**
- Your main Gmail password
- Sharing your App Password in chat/email
- Committing passwords to GitHub

---

## 📧 What Emails Users Will Receive

✅ Account Activation - "Dear [username], your account has been successfully activated!"

💰 Task Earnings - "Congratulations! You have earned $50 from completing Survey Task!"

🚀 New Referral - "Great news! [friend name] just joined using your referral link! You earned $500"

🎁 Level 2/3 Bonuses - "You received a Level 2 referral bonus of $200!"

💳 Withdrawal - "Your withdrawal of $500 has been processed to PayPal"

---

**All emails sent from:** netlinkagencies254@gmail.com ✅
