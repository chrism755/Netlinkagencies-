import admin from 'firebase-admin';
import nodemailer from 'nodemailer';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, username } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required.' });

  try {
    const actionCodeSettings = {
      url: 'https://netlinkagencies.linkpc.net/do-reset',
      handleCodeInApp: false
    };

    const resetLink = await admin.auth().generatePasswordResetLink(email, actionCodeSettings);

    await transporter.sendMail({
      from: `"NETLINK AGENCIES" <${process.env.GMAIL_USER}>`,
      to: email,
      replyTo: process.env.GMAIL_USER,
      subject: '🔐 Reset Your NETLINK AGENCIES Password',
      html: `
        <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
          <h2 style="margin:0 0 16px;font-size:24px;font-weight:800;color:#E91E8C;">Reset Your Password 🔐</h2>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">Hi <strong>${username}</strong>, we received a request to reset your NETLINK AGENCIES password.</p>
          <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
          <div style="text-align:center;margin:24px 0;">
            <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#E91E8C,#FF4DB8);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">Reset Password</a>
          </div>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#555;">Or copy and paste this link into your browser:<br/>
          <a href="${resetLink}" style="color:#E91E8C;word-break:break-all;">${resetLink}</a></p>
          <p style="margin:0 0 18px;font-size:14px;line-height:1.6;color:#999;">If you did not request a password reset, you can safely ignore this email.</p>
          <p style="margin:20px 0 0;font-size:12px;color:#999;">If you have any questions, just reply to this email.</p>
        </div>
      `
    });

    return res.status(200).json({ success: true });

  } catch (err) {
    console.error('Reset password error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
