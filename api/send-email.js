import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,        // your full gmail address
    pass: process.env.GMAIL_APP_PASSWORD // 16-char app password (no spaces)
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, username, country, amount, method, txnId, referredBy, date } = req.body;

  const isActivation = type === 'activation';
  const senderName = isActivation ? 'Courtney ' : 'Netlink agencies';
  const siteLink = isActivation ? 'courtneytech.xyz' : 'netlinkagencies';

  const subjects = {
    activation: 'Welcome to Courtney Tech!',
    activation_pending: 'hallo',
    withdrawal_submitted: 'Withdrawal Request Received',
    withdrawal_approved: 'Withdrawal Processed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account'
  };

  const texts = {
    activation_pending:
`Dear ${username},

hello your Transaction ID submitted successfully we will notify you once you're account is activated'

— ${senderName}`,

    activation:
`Welcome, ${username}!

Your Courtneytech account is ready. You can now:

- Accept M-Pesa payments via your DTB/PayBill account
- Create shareable payment links
- Track all transactions in real time
- Set up your digital storefront

Next step: Complete your KYC verification to unlock full payment capabilities.

If you have any questions, reply to this email or visit.

— ${senderName}`,

    withdrawal_submitted:
`Hi ${username},

Your withdrawal request has been received.

Amount: ${amount}
Method: ${method}
Date: ${date}

Please allow 24-48 hours for processing.

— ${senderName}`,

    withdrawal_approved:
`Hi ${username},

Your withdrawal of ${amount} has been processed via ${method}.

— ${senderName}`,

    new_referral:
`Hi ${username},

Someone just joined using your referral link.

New member: ${referredBy}
Date: ${date}

— ${senderName}`,

    karibu_bonus:
`Hi ${username},

Your Karibu bonus of ${amount} has been credited to your account.

— ${senderName}`
  };

  if (!subjects[type]) return res.status(400).json({ error: 'Invalid type' });

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: process.env.GMAIL_USER,
      subject: subjects[type],
      text: texts[type]
    });

    return res.status(200).json({ success: true, id: info.messageId });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
