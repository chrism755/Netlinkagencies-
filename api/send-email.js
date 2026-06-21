import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export default async function handler(req, res) {
  // Basic CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.error('Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables');
    return res.status(500).json({ error: 'Email configuration not set' });
  }

  const { to } = req.body || {};
  if (!to) return res.status(400).json({ error: 'Missing recipient (to)' });

  // Minimal, link-free transactional message
  const subject = 'Payment received';
  const textBody = 'We have received your payment to account. Processing.';
  const htmlBody = `<!doctype html><html><head><meta charset="utf-8"/></head><body style="font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;margin:0;padding:16px;">` +
    `<div style="max-width:680px;margin:0 auto;padding:18px;border-radius:6px;">` +
    `<p style="font-size:15px;margin:0">We have received your payment to account. Processing.</p>` +
    `</div></body></html>`;

  try {
    // Keep From aligned to authenticated sender
    const fromAddress = `"NETLINK AGENCIES" <${process.env.GMAIL_USER}>`;

    const info = await transporter.sendMail({
      from: fromAddress,
      to,
      replyTo: process.env.GMAIL_USER,
      subject,
      text: textBody,
      html: htmlBody,
      headers: {
        'Sender': process.env.GMAIL_USER,
        'X-Mailer': 'NetlinkAgencies Mailer'
      }
    });

    console.info('Email sent', { to, messageId: info.messageId });
    return res.status(200).json({ success: true, id: info.messageId });
  } catch (err) {
    console.error('Error sending email:', err && (err.message || err));
    return res.status(500).json({ error: err && (err.message || 'Unknown error') });
  }
}
