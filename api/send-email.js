import nodemailer from 'nodemailer';
import { URL } from 'url';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function textToHtml(text) {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function buildUnsubscribeHeaders(to) {
  const headers = [];
  if (process.env.UNSUBSCRIBE_EMAIL) {
    headers.push(`<mailto:${process.env.UNSUBSCRIBE_EMAIL}>`);
  }
  if (process.env.SITE_URL) {
    // include a one-click unsubscribe URL with an email query param placeholder
    const base = process.env.SITE_URL.replace(/\/$/, '');
    // If we have the recipient, include it in the URL so clients can pre-fill
    const url = to ? `${base}/unsubscribe?email=${encodeURIComponent(to)}` : `${base}/unsubscribe`;
    headers.push(`<${url}>`);
  }
  return headers.join(', ');
}

export default async function handler(req, res) {
  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Validate environment first
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
    return res.status(500).json({ error: 'Email configuration not set' });
  }

  const { type, to, username, country, amount, method, txnId, referredBy, date } = req.body || {};

  if (!type) return res.status(400).json({ error: 'Missing type' });
  if (!to) return res.status(400).json({ error: 'Missing recipient (to)' });

  const isActivation = type === 'activation';
  const senderName = isActivation ? 'Courtney Tech' : 'NETLINK AGENCIES';
  const siteLink = isActivation ? 'https://courtneytech.xyz' : (process.env.SITE_URL || 'https://netlinkagencies.linkpc.net');

  const subjects = {
    activation: 'Welcome to Courtney Tech!',
    activation_pending: 'Payment Received',
    withdrawal_submitted: 'Withdrawal Request Received',
    withdrawal_approved: 'Withdrawal Processed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account'
  };

  const texts = {
    activation_pending:
`Dear ${username || 'user'},

Your transaction ID is being processed. We will notify you once your account is activated.

— ${senderName}`,

    activation:
`Welcome, ${username || 'user'}!

Your Courtneytech account is ready. You can now:

- Accept M-Pesa payments via your DTB/PayBill account
- Create shareable payment links
- Track all transactions in real time
- Set up your digital storefront

Next step: Complete your KYC verification to unlock full payment capabilities.

If you have any questions, reply to this email or visit ${siteLink}.

— ${senderName}`,

    withdrawal_submitted:
`Hi ${username || 'user'},

Your withdrawal request has been received.

Amount: ${amount || 'N/A'}
Method: ${method || 'N/A'}
Date: ${date || 'N/A'}

Please allow 24-48 hours for processing.

— ${senderName}`,

    withdrawal_approved:
`Hi ${username || 'user'},

Your withdrawal of ${amount || 'N/A'} has been processed via ${method || 'N/A'}.

— ${senderName}`,

    new_referral:
`Hi ${username || 'user'},

Someone just joined using your referral link.

New member: ${referredBy || 'N/A'}
Date: ${date || 'N/A'}

— ${senderName}`,

    karibu_bonus:
`Hi ${username || 'user'},

Your Karibu bonus of ${amount || 'N/A'} has been credited to your account.

— ${senderName}`
  };

  if (!subjects[type]) return res.status(400).json({ error: 'Invalid type' });

  // Build message
  const textBody = texts[type];
  const unsubscribeLink = process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, '')}/unsubscribe?email=${encodeURIComponent(to)}` : null;
  const htmlBody = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;line-height:1.4;margin:0;padding:16px;">` +
    ` <div style="max-width:600px;margin:0 auto;padding:12px;">` +
    ` <h2 style="color:#0b5cff">${subjects[type]}</h2>` +
    textToHtml(textBody) +
    (unsubscribeLink ? ` <p style="font-size:13px;color:#666;">If you no longer wish to receive these emails, <a href="${unsubscribeLink}">click here to unsubscribe</a>.</p>` : '') +
    ` <hr style="border:none;border-top:1px solid #eee;margin:18px 0;"/>` +
    ` <p style="font-size:12px;color:#666;">This message was sent from ${siteLink}. If you did not expect this email, you can ignore it or contact support.</p>` +
    ` </div></body></html>`;

  try {
    // Build List-Unsubscribe header
    const listUnsubscribe = buildUnsubscribeHeaders(to);

    const headers = {};
    if (listUnsubscribe) headers['List-Unsubscribe'] = listUnsubscribe;
    // If we provided a one-click URL, advertise support for List-Unsubscribe-Post
    if (process.env.SITE_URL) headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';

    // Ensure the From uses the authenticated Gmail user to avoid SPF/DKIM mismatches
    const fromAddress = `"${senderName}" <${process.env.GMAIL_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: process.env.GMAIL_USER,
      subject: subjects[type],
      text: textBody,
      html: htmlBody,
      headers
    });

    console.info('Email sent', { to, type, messageId: info.messageId });
    return res.status(200).json({ success: true, id: info.messageId });

  } catch (err) {
    console.error('Error sending email:', err && (err.message || err));
    return res.status(500).json({ error: err && (err.message || 'Unknown error') });
  }
}
