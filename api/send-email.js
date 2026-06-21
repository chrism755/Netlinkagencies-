import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,        // your full gmail address
    pass: process.env.GMAIL_APP_PASSWORD // 16-char app password (no spaces)
  }
});

function renderEmail(heading, body, footer) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;">${heading}</h2>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#333;">${body}</p>
    <p style="margin:0;font-size:12px;color:#999;">${footer}</p>
  </div>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, username, country, amount, method, txnId, referredBy, date } = req.body;

  const isActivation = type === 'activation';
  const senderName = isActivation ? 'Courtney Tech' : 'NETLINK AGENCIES';
  const siteLink = isActivation ? 'courtneytech.xyz' : 'netlinkagencies.linkpc.net';

  const subjects = {
    activation: 'Welcome to Courtney Tech!',
    activation_pending: 'Payment Received',
    withdrawal_submitted: 'Withdrawal Request Received',
    withdrawal_approved: 'Withdrawal Processed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account'
  };

  const ignoreFooter = "If you didn't request this, you can ignore this email.";
  const replyFooter = "If you have any questions, just reply to this email.";

  const emails = {
    activation_pending: renderEmail(
      'Test user ⏳',
      `Dear ${username}, your  is being processed. We will notify you once your account is activated.`,
      replyFooter
    ),

    activation: renderEmail(
      `Welcome, ${username}! 🎉`,
      `Your Courtneytech account is ready. You can accept M-Pesa payments via your DTB/PayBill account, create shareable payment links, track all transactions in real time, and set up your digital storefront. Next step: complete your KYC verification to unlock full payment capabilities. Visit ${siteLink} anytime.`,
      replyFooter
    ),

    withdrawal_submitted: renderEmail(
      'Withdrawal Request Received',
      `Hi ${username}, your withdrawal request for ${amount} via ${method} has been received on ${date}. Please allow 24-48 hours for processing.`,
      replyFooter
    ),

    withdrawal_approved: renderEmail(
      'Withdrawal Processed ✅',
      `Hi ${username}, your withdrawal of ${amount} has been processed via ${method}.`,
      replyFooter
    ),

    new_referral: renderEmail(
      'New Referral! 🎉',
      `Hi ${username}, someone just joined using your referral link. New member: ${referredBy}, on ${date}.`,
      replyFooter
    ),

    karibu_bonus: renderEmail(
      'Bonus Credited! 🎁',
      `Hi ${username}, your Karibu bonus of ${amount} has been credited to your account.`,
      replyFooter
    )
  };

  if (!subjects[type]) return res.status(400).json({ error: 'Invalid type' });

  try {
    const info = await transporter.sendMail({
      from: `"${senderName}" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: process.env.GMAIL_USER,
      subject: subjects[type],
      html: emails[type]
    });

    return res.status(200).json({ success: true, id: info.messageId });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
      }
