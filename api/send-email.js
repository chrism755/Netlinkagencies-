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

  const subjects = {
    activation: 'Welcome to Courtney Tech!',
    activation_pending: 'Payment Confirmation',
    withdrawal_submitted: 'Withdrawal Request Received',
    withdrawal_approved: 'Withdrawal Processed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account'
  };

  const bodies = {
    activation_pending: `<p>Hi <strong>${username}</strong>,</p><p>We have received your payment with Transaction ID: <strong>${txnId}</strong>.</p><p>Your account will be activated within <strong>2-5 minutes</strong>.</p><p>If not activated within 5 minutes please contact admin on WhatsApp.</p>`,
    activation: `<h2 style="margin:0 0 16px;color:#1a1a1a;">Welcome, ${username}! 🎉</h2><p>Your Courtneytech account is ready. You can now:</p><ul style="padding-left:20px;line-height:1.7;"><li>Accept M-Pesa payments via your DTB/PayBill account</li><li>Create shareable payment links</li><li>Track all transactions in real time</li><li>Set up your digital storefront</li></ul><p><strong>Next step:</strong> Complete your KYC verification to unlock full payment capabilities.</p><p>If you have any questions, reply to this email or visit <a href="https://courtneytech.xyz">courtneytech.xyz</a>.</p>`,
    withdrawal_submitted: `<p>Hi <strong>${username}</strong>,</p><p>Your withdrawal request has been received.<br/>Amount: ${amount}<br/>Method: ${method}<br/>Date: ${date}</p><p>Please wait 24-48 hours.</p>`,
    withdrawal_approved: `<p>Hi <strong>${username}</strong>,</p><p>Your withdrawal of <strong>${amount}</strong> has been processed via ${method}.</p>`,
    new_referral: `<p>Hi <strong>${username}</strong>,</p><p>Someone just joined using your referral link!<br/>New Member: ${referredBy}<br/>Date: ${date}</p>`,
    karibu_bonus: `<p>Hi <strong>${username}</strong>,</p><p>Your Karibu bonus of <strong>${amount}</strong> has been credited!</p>`
  };

  if (!subjects[type]) return res.status(400).json({ error: 'Invalid type' });

  const isActivation = type === 'activation';
  const brandName = isActivation ? 'COURTNEYTECH' : 'NETLINK AGENCIES';
  const footerName = isActivation ? 'Courtney Tech' : 'NETLINK AGENCIES';
  const footerLink = isActivation
    ? '<a href="https://courtneytech.xyz">courtneytech.xyz</a>'
    : '<a href="https://netlinkagencies.linkpc.net">netlinkagencies.linkpc.net</a>';

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
      <div style="background:linear-gradient(135deg,#B0156A,#FF4DB8);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">${brandName}</h1>
      </div>
      <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;">
        ${bodies[type]}
        <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
        <p style="color:#aaa;font-size:12px;">${footerName} — ${footerLink}</p>
      </div>
    </div>`;

  try {
    const info = await transporter.sendMail({
      from: `"${footerName}" <${process.env.GMAIL_USER}>`,
      to,
      replyTo: isActivation ? process.env.GMAIL_USER : 'nentlinkagencies254@gmail.com',
      subject: subjects[type],
      html
    });

    return res.status(200).json({ success: true, id: info.messageId });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
    }
