# Email Notification Setup Guide

## Overview
Your application now sends automated email notifications for key events:
- ✅ Account Activation
- 💰 Task Earnings
- 🚀 New Referrals & Level Bonuses
- 💳 Withdrawal Processing

## Setup Instructions

### 1. Install Dependencies
First, install the required packages in your Firebase functions directory:

```bash
npm install nodemailer @sendgrid/mail
```

### 2. Configure Email Service - SendGrid (Recommended for Production)

#### Step 1: Create SendGrid Account
1. Go to https://sendgrid.com and sign up
2. Verify your email address
3. Create a sender identity (Verify a Single Sender)

#### Step 2: Generate SendGrid API Key
1. Log into SendGrid dashboard
2. Navigate to **Settings → API Keys**
3. Click **Create API Key**
4. Name it: `Firebase Functions`
5. Select **Full Access** permissions
6. Copy the API key (save it securely)

#### Step 3: Update emailService.js for SendGrid
Replace your `emailService.js` with this:

```javascript
const sgMail = require("@sendgrid/mail");

// Set your SendGrid API key from environment variables
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Email templates
const emailTemplates = {
  accountActivated: (username, email) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@netlinkagencies.com",
    subject: "Account Activated Successfully! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Welcome, ${username}!</h2>
        <p>Your account has been successfully activated.</p>
        <p>You can now:</p>
        <ul>
          <li>Complete tasks and earn money</li>
          <li>Refer others and earn commissions</li>
          <li>Withdraw your earnings</li>
        </ul>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  taskEarnings: (username, email, amount, taskName) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@netlinkagencies.com",
    subject: `You earned $${amount} from a task! 💰`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Congratulations, ${username}!</h2>
        <p>You have earned <strong>$${amount}</strong> from completing the task:</p>
        <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;"><strong>${taskName}</strong></p>
        <p>Your new balance is available in your dashboard.</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Earnings</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  newReferral: (username, email, referralName, bonus) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@netlinkagencies.com",
    subject: `New Referral Bonus! 🚀 +$${bonus}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Great news, ${username}!</h2>
        <p><strong>${referralName}</strong> just joined using your referral link!</p>
        <p>You earned a bonus of <strong>$${bonus}</strong></p>
        <p>Keep referring to earn more!</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Share Your Link</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  withdrawalProcessed: (username, email, amount, method) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@netlinkagencies.com",
    subject: `Withdrawal Processed Successfully ✅`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Withdrawal Confirmed, ${username}!</h2>
        <p>Your withdrawal request has been processed.</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Method:</strong> ${method}</p>
        <p>The funds should appear in your account within 1-3 business days.</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Transaction</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  levelBonus: (username, email, level, amount) => ({
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || "noreply@netlinkagencies.com",
    subject: `Level ${level} Referral Bonus! 🎁 +$${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Referral Bonus Earned, ${username}!</h2>
        <p>You received a <strong>Level ${level} referral bonus</strong> of <strong>$${amount}</strong></p>
        <p>One of your referrals (or their referrals) completed a task, and you earned a commission!</p>
        <p>Keep building your network to earn more!</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Referrals</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),
};

// Send email function
async function sendEmail(type, userData, additionalData = {}) {
  try {
    let emailConfig;

    switch (type) {
      case "accountActivated":
        emailConfig = emailTemplates.accountActivated(userData.username, userData.email);
        break;
      case "taskEarnings":
        emailConfig = emailTemplates.taskEarnings(
          userData.username,
          userData.email,
          additionalData.amount,
          additionalData.taskName
        );
        break;
      case "newReferral":
        emailConfig = emailTemplates.newReferral(
          userData.username,
          userData.email,
          additionalData.referralName,
          additionalData.bonus
        );
        break;
      case "withdrawalProcessed":
        emailConfig = emailTemplates.withdrawalProcessed(
          userData.username,
          userData.email,
          additionalData.amount,
          additionalData.method
        );
        break;
      case "levelBonus":
        emailConfig = emailTemplates.levelBonus(
          userData.username,
          userData.email,
          additionalData.level,
          additionalData.amount
        );
        break;
      default:
        console.log("Unknown email type");
        return;
    }

    await sgMail.send(emailConfig);
    console.log(`Email sent: ${type} to ${userData.email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendEmail };
```

#### Step 4: Set Firebase Environment Variables
```bash
firebase functions:config:set sendgrid.api_key="SG.your-long-api-key-here" sendgrid.from_email="noreply@netlinkagencies.com"
```

#### Step 5: Deploy Cloud Functions
```bash
firebase deploy --only functions
```

## Database Schema Requirements

Ensure your Firestore collections have these fields:

#### Users Collection
```javascript
{
  userId: "user123",
  username: "john_doe",
  email: "john@example.com",
  fullName: "John Doe",
  status: "active", // or "pending"
  referralCode: "INV123",
  referredBy: "INV456",
  balance: 1000,
  totalEarnings: 5000,
  referralEarnings: 2000,
  completedTasks: 15,
  l1Referrals: 5,
  l2Referrals: 2,
  l3Referrals: 1
}
```

#### Tasks Collection (for task earnings)
```javascript
{
  taskId: "task123",
  taskName: "Survey Task",
  userId: "user123",
  status: "completed", // or "pending", "in_progress"
  reward: 50
}
```

#### Withdrawals Collection (for withdrawal notifications)
```javascript
{
  withdrawalId: "wd123",
  userId: "user123",
  amount: 500,
  method: "Bank Transfer", // or "PayPal", etc.
  status: "processed", // or "pending", "rejected"
  createdAt: timestamp,
  processedAt: timestamp
}
```

## Email Events Triggered

### 1. Account Activation
**Trigger**: User status changes from `pending` → `active`
**Recipients**: 
- New user
- L1 referrer (gets new referral bonus notification)
- L2 referrer (gets level 2 bonus notification)
- L3 referrer (gets level 3 bonus notification)

**Example Email**: "Dear john_doe your account has been activated"

### 2. Task Earnings
**Trigger**: Task status changes to `completed`
**Recipients**: User who completed the task

**Example Email**: "You earned $50 from completing Survey Task"

### 3. New Referral
**Trigger**: When a referred user activates their account
**Recipients**: The referrer(s)

**Example Email**: "Great news! jane_doe just joined using your referral link! You earned a bonus of $500"

### 4. Level Bonuses (L2 & L3)
**Trigger**: When referrals complete tasks
**Recipients**: L2 and L3 referrers

**Example Email**: "You received a Level 2 referral bonus of $200"

### 5. Withdrawal Processed
**Trigger**: Withdrawal status changes to `processed`
**Recipients**: User requesting the withdrawal

**Example Email**: "Your withdrawal of $500 has been processed to Bank Transfer"

## Customization

### Edit Email Templates
Open `emailService.js` and modify the `emailTemplates` object to customize:
- Email subject lines
- HTML content
- Colors and styling
- Call-to-action buttons

Example:
```javascript
accountActivated: (username, email) => ({
  to: email,
  from: "support@netlinkagencies.com",
  subject: "Welcome ${username}! Your account is ready 🎉",
  html: `...` // Your custom HTML
})
```

### Customize Bonus Amounts
In `index.js`, update these values:
```javascript
const L1_BONUS = 500;  // Level 1 referral bonus
const L2_BONUS = 200;  // Level 2 referral bonus
const L3_BONUS = 100;  // Level 3 referral bonus
```

## Testing SendGrid Integration

### Test Email Sending Locally
1. Set your API key:
```bash
export SENDGRID_API_KEY="SG.your-api-key"
```

2. Use Firebase emulator:
```bash
firebase emulators:start --only functions
```

### View SendGrid Activity
1. Go to SendGrid dashboard → Mail Send → Overview
2. You'll see all sent emails in real-time

## Troubleshooting

### Emails Not Sending?

1. **Check Firebase Logs**:
```bash
firebase functions:log --limit 50
```

2. **Verify Configuration**:
```bash
firebase functions:config:get
```

3. **Check SendGrid Dashboard**:
   - Login to https://app.sendgrid.com
   - Go to Mail Send → Overview to see failed emails
   - Check for bounce reasons

4. **Verify Sender Email**:
   - Ensure the sender email is verified in SendGrid
   - Go to Settings → Sender Authentication

### Common Errors

| Error | Solution |
|-------|----------|
| `Invalid API key` | Verify API key is correct in Firebase config |
| `Email bounced` | Check that recipient email is valid |
| `Unauthenticated sender` | Verify sender email in SendGrid dashboard |
| `Permission denied` | Update Firestore security rules |
| `User not found` | Ensure user exists in database |

## Security Best Practices

1. **Never commit API keys** - Use Firebase Functions config
2. **Use environment variables** for all sensitive data
3. **Enable API key restrictions** in SendGrid dashboard
4. **Monitor SendGrid dashboard** for unusual activity
5. **Use HTTPS** for all email links
6. **Validate email addresses** before sending

## Next Steps

1. ✅ Create SendGrid account
2. ✅ Generate and save API key
3. ✅ Verify a sender email in SendGrid
4. ✅ Update emailService.js with SendGrid code
5. ✅ Set Firebase environment variables
6. ✅ Deploy Cloud Functions
7. ✅ Test with a real user activation
8. ✅ Monitor SendGrid dashboard

## Support

- SendGrid Docs: https://docs.sendgrid.com/
- Firebase Functions: https://firebase.google.com/docs/functions
- SendGrid Status: https://status.sendgrid.com/

---

**Last Updated**: 2026-06-16
**Version**: 2.0 (SendGrid)
