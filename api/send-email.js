import nodemailer from 'nodemailer';
import crypto from 'crypto';

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
    .map(p => `<p style="margin:0 0 12px">${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function buildUnsubscribeHeaders(to, tokenUrl) {
  const headers = [];
  if (process.env.UNSUBSCRIBE_EMAIL) {
    headers.push(`<mailto:${process.env.UNSUBSCRIBE_EMAIL}>`);
  }
  if (tokenUrl) {
    headers.push(`<${tokenUrl}>`);
  } else if (process.env.SITE_URL) {
    const base = process.env.SITE_URL.replace(/\/$/, '');
    const url = to ? `${base}/unsubscribe?email=${encodeURIComponent(to)}` : `${base}/unsubscribe`;
    headers.push(`<${url}>`);
  }
  return headers.join(', ');
}

function createSignedToken(email) {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.GMAIL_APP_PASSWORD || 'fallback-secret';
  const payload = Buffer.from(email, 'utf8').toString('base64url');
  const h = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${h}`;
}

function generateSubject(type, username) {
  const name = username ? `${username}` : '';
  switch (type) {
    case 'activation':
      return name ? `${name}, welcome to Netlink Agencies` : 'Welcome to Netlink Agencies';
    case 'activation_pending':
      return name ? `${name}, we received your payment` : 'Payment received';
    case 'withdrawal_submitted':
      return 'Withdrawal request received';
    case 'withdrawal_approved':
      return 'Your withdrawal has been processed';
    case 'new_referral':
      return 'Someone joined using your referral';
    case 'karibu_bonus':
      return 'Your Karibu bonus has been credited';
    default:
      return 'Notification from Netlink Agencies';
  }
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

  // Plain text templates (kept concise and transactional)
  const texts = {
    activation_pending:
`Hi ${username || 'there'},\n\nWe have received your payment and are processing it. We'll update your account status shortly.\n\nTransaction ID: ${txnId || 'N/A'}\nAmount: ${amount || 'N/A'}\n\nIf you have questions, reply to this email or contact support at ${process.env.UNSUBSCRIBE_EMAIL || process.env.GMAIL_USER}.\n\n— ${senderName}`,

    activation:
`Hi ${username || 'there'},\n\nWelcome to Netlink Agencies — your account is ready. To get started, log in at ${siteLink}.\n\nIf you need help, reply to this email.\n\n— ${senderName}`,

    withdrawal_submitted:
`Hi ${username || 'there'},\n\nWe received your withdrawal request.\n\nAmount: ${amount || 'N/A'}\nMethod: ${method || 'N/A'}\nDate: ${date || 'N/A'}\n\nWe'll process it within 24-48 hours.\n\n— ${senderName}`,

    withdrawal_approved:
`Hi ${username || 'there'},\n\nYour withdrawal of ${amount || 'N/A'} has been processed via ${method || 'N/A'}.\n\n— ${senderName}`,

    new_referral:
`Hi ${username || 'there'},\n\nA new user joined using your referral link.\n\nNew member: ${referredBy || 'N/A'}\nDate: ${date || 'N/A'}\n\n— ${senderName}`,

    karibu_bonus:
`Hi ${username || 'there'},\n\nYour Karibu bonus of ${amount || 'N/A'} has been credited to your account.\n\n— ${senderName}`
  };

  if (!texts[type]) return res.status(400).json({ error: 'Invalid type' });

  const textBody = texts[type];
  const preheader = textBody.split('\n')[0].slice(0, 120); // first line as preheader

  // create signed token for one-click unsubscribe
  const token = createSignedToken(to);
  const tokenUrl = process.env.SITE_URL ? `${process.env.SITE_URL.replace(/\/$/, '')}/unsubscribe?token=${encodeURIComponent(token)}` : null;

  const companyAddress = process.env.COMPANY_ADDRESS || '';
  const supportEmail = process.env.SUPPORT_EMAIL || process.env.UNSUBSCRIBE_EMAIL || process.env.GMAIL_USER;

  const htmlBody = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body style="font-family:Inter,Arial,Helvetica,sans-serif;color:#111;background:#ffffff;margin:0;padding:24px;">` +
    ` <span style="display:none!important;max-height:0;overflow:hidden;">${preheader}</span>` +
    ` <div style="max-width:680px;margin:0 auto;border:1px solid #f0f0f0;padding:20px;border-radius:6px;">` +
    ` <header style="text-align:left;margin-bottom:18px;"><img src="${process.env.SITE_URL ? process.env.SITE_URL.replace(/\/$/, '') + '/logo.png' : ''}" alt="" style="height:28px;object-fit:contain;display:block;margin-bottom:8px;" onerror="this.style.display='none'"/>` +
    ` <h1 style="font-size:18px;margin:0 0 6px;color:#0b5cff;font-weight:600">${generateSubject(type, username)}</h1>` +
    ` <p style="margin:0;color:#6b7280;font-size:13px">${preheader}</p></header>` +
    ` <main style="padding:6px 0 12px;color:#111;font-size:15px;">` +
    textToHtml(textBody) +
    ` </main>` +
    ` <footer style="border-top:1px solid #eef2f7;padding-top:14px;color:#6b7280;font-size:13px;">` +
    (companyAddress ? `<div style="margin-bottom:8px">${companyAddress}</div>` : '') +
    `<div>If you need help, contact <a href="mailto:${supportEmail}" style="color:#0b5cff">${supportEmail}</a>.</div>` +
    (tokenUrl ? `<div style="margin-top:8px;font-size:13px;color:#6b7280">To stop receiving these emails, <a href="${tokenUrl}" style="color:#0b5cff">unsubscribe</a>.</div>` : '') +
    `</footer></div></body></html>`;

  try {
    // Build List-Unsubscribe header
    const listUnsubscribe = buildUnsubscribeHeaders(to, tokenUrl);

    const headers = {};
    if (listUnsubscribe) headers['List-Unsubscribe'] = listUnsubscribe;
    if (tokenUrl) headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
    // Add List-ID and Sender headers to improve classification
    if (process.env.SITE_URL) {
      try {
        const domain = new URL(process.env.SITE_URL).hostname;
        headers['List-ID'] = `${domain}`;
      } catch (e) {
        headers['List-ID'] = process.env.SITE_URL;
      }
    }
    headers['Sender'] = process.env.GMAIL_USER;
    headers['X-Mailer'] = 'NetlinkAgencies Mailer';

    // Ensure the From uses the authenticated Gmail user to avoid SPF/DKIM mismatches
    const fromAddress = `"${senderName}" <${process.env.GMAIL_USER}>`;

    const subject = generateSubject(type, username);

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: supportEmail,
      subject,
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
