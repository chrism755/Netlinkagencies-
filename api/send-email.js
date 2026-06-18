import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nentlinkagencies254@gmail.com',
    pass: 'vbzo anmw ozyw fgsq'
  }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, username, country, amount, method, txnId, referredBy, date } = req.body;

  let subject = '';
  let html = '';

  const header = `
    <div style="background:linear-gradient(135deg,#B0156A,#FF4DB8);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">🔗 NETLINK AGENCIES</h1>
    </div>
    <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;font-family:Arial,sans-serif;">
  `;
  const footer = `
      <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
      <p style="color:#aaa;font-size:11px;text-align:center;">
        Happy networking! — NETLINK AGENCIES<br/>
        <a href="https://netlinkagencies.linkpc.net">netlinkagencies.linkpc.net</a>
      </p>
    </div>
  `;
  const wrap = (content) => `<div style="max-width:600px;margin:0 auto;">${header}${content}${footer}</div>`;

  if (type === 'activation') {
    subject = 'Your NETLINK AGENCIES account is now active';
    html = wrap(`
      <h2 style="color:#B0156A;">Account Activated! 🎉</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your account has been successfully activated. You can now access your dashboard and start earning.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Username:</strong> ${username}</p>
        <p style="margin:4px 0;"><strong>Country:</strong> ${country}</p>
        <p style="margin:4px 0;"><strong>Transaction ID:</strong> ${txnId}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
      </div>
      <a href="https://netlinkagencies.linkpc.net/dashboard" style="display:inline-block;background:linear-gradient(135deg,#B0156A,#FF4DB8);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Dashboard</a>
    `);

  } else if (type === 'withdrawal_submitted') {
    subject = 'Withdrawal Request Received - NETLINK AGENCIES';
    html = wrap(`
      <h2 style="color:#B0156A;">Withdrawal Request Received 💰</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your withdrawal request has been received and is being processed.</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Amount:</strong> ${amount}</p>
        <p style="margin:4px 0;"><strong>Method:</strong> ${method}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
      </div>
      <p style="color:#555;">Please wait 24-48 hours for processing.</p>
    `);

  } else if (type === 'withdrawal_approved') {
    subject = 'Your Withdrawal Has Been Processed - NETLINK AGENCIES';
    html = wrap(`
      <h2 style="color:#B0156A;">Withdrawal Processed ✅</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Your withdrawal has been successfully processed!</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>Amount:</strong> ${amount}</p>
        <p style="margin:4px 0;"><strong>Method:</strong> ${method}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
      </div>
      <p style="color:#555;">The funds have been sent to your ${method} account.</p>
    `);

  } else if (type === 'new_referral') {
    subject = 'Someone Joined Using Your Referral Link - NETLINK AGENCIES';
    html = wrap(`
      <h2 style="color:#B0156A;">New Referral! 🎯</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Someone just joined NETLINK AGENCIES using your referral link!</p>
      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin:16px 0;">
        <p style="margin:4px 0;"><strong>New Member:</strong> ${referredBy}</p>
        <p style="margin:4px 0;"><strong>Date:</strong> ${date}</p>
      </div>
      <p style="color:#555;">Keep sharing your referral link to earn more!</p>
      <a href="https://netlinkagencies.linkpc.net/dashboard" style="display:inline-block;background:linear-gradient(135deg,#B0156A,#FF4DB8);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>
    `);

  } else if (type === 'karibu_bonus') {
    subject = 'Your Karibu Bonus Has Been Credited - NETLINK AGENCIES';
    html = wrap(`
      <h2 style="color:#B0156A;">Karibu Bonus Credited! 🎁</h2>
      <p>Hi <strong>${username}</strong>,</p>
      <p>Congratulations! Your Karibu bonus of <strong>${amount}</strong> has been credited to your account.</p>
      <a href="https://netlinkagencies.linkpc.net/dashboard" style="display:inline-block;background:linear-gradient(135deg,#B0156A,#FF4DB8);color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:bold;">View Dashboard</a>
    `);

  } else {
    return res.status(400).json({ error: 'Invalid email type' });
  }

  try {
    await transporter.sendMail({
      from: 'NETLINK AGENCIES <nentlinkagencies254@gmail.com>',
      to: to,
      replyTo: 'nentlinkagencies254@gmail.com',
      subject: subject,
      html: html
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Email error:', err);
    return res.status(500).json({ error: err.message });
  }
}
