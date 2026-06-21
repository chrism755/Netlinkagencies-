import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  // simple regex for basic validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req, res) {
  // Support OPTIONS for CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Extract client IP for logging
  const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';

  if (req.method === 'GET') {
    const email = (req.query?.email || '').toString();
    if (!isValidEmail(email)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(400).send(`<!doctype html><html><body><h2>Invalid unsubscribe request</h2><p>The email provided is not valid.</p></body></html>`);
    }

    // Notify owner about unsubscribe
    const notifyTo = process.env.UNSUBSCRIBE_EMAIL || process.env.GMAIL_USER;
    const subject = `Unsubscribe request: ${email}`;
    const text = `Unsubscribe request received for ${email}\n\nFrom IP: ${clientIp}\nTime: ${new Date().toISOString()}`;

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await transporter.sendMail({
          from: `"Unsubscribe Bot" <${process.env.GMAIL_USER}>`,
          to: notifyTo,
          subject,
          text
        });
      } catch (err) {
        console.error('Failed to send unsubscribe notification email:', err && (err.message || err));
        // continue to show confirmation page even if notification fails
      }
    } else {
      console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set; skipping notification send');
    }

    // Render a simple confirmation page
    const safeEmail = email.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:Arial,Helvetica,sans-serif;padding:20px;color:#111"><div style="max-width:600px;margin:0 auto"><h2>Unsubscribed</h2><p>The email <strong>${safeEmail}</strong> has been unsubscribed (it may take a few minutes to take effect).</p><p>If you did not request this, please contact support.</p></div></body></html>`);
  }

  if (req.method === 'POST') {
    // Expect JSON body with { email: '...' }
    const body = req.body || {};
    const email = (body.email || '').toString();
    const reason = (body.reason || '').toString();

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }

    const notifyTo = process.env.UNSUBSCRIBE_EMAIL || process.env.GMAIL_USER;
    const subject = `Unsubscribe API request: ${email}`;
    const text = `Unsubscribe request received for ${email}\nReason: ${reason || 'N/A'}\nFrom IP: ${clientIp}\nTime: ${new Date().toISOString()}`;

    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      try {
        await transporter.sendMail({
          from: `"Unsubscribe Bot" <${process.env.GMAIL_USER}>`,
          to: notifyTo,
          subject,
          text
        });
      } catch (err) {
        console.error('Failed to send unsubscribe notification email:', err && (err.message || err));
        // return success but include warning
        return res.status(200).json({ success: true, warning: 'Notification email failed to send' });
      }
    } else {
      console.warn('GMAIL_USER or GMAIL_APP_PASSWORD not set; skipping notification send');
    }

    return res.status(200).json({ success: true, email });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
