import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,        // your full gmail address
    pass: process.env.GMAIL_APP_PASSWORD // 16-char app password (no spaces)
  }
});

const senderName = 'NETLINK AGENCIES';
const replyFooter = "If you have any questions, just reply to this email.";

function renderEmail(heading, bodyHtml, footer, headingColor) {
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
    <h2 style="margin:0 0 16px;font-size:${headingColor ? '24px' : '20px'};font-weight:800;color:${headingColor || '#1a1a1a'};">${heading}</h2>
    ${bodyHtml}
    <p style="margin:20px 0 0;font-size:12px;color:#999;">${footer}</p>
  </div>`;
}

function p(text) {
  return `<p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">${text}</p>`;
}

function receiptTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 18px;font-size:14px;">
    ${rows.map(([k, v]) => `<tr><td style="padding:6px 0;color:#888;border-bottom:1px solid #eee;">${k}</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#1a1a1a;border-bottom:1px solid #eee;">${v}</td></tr>`).join('')}
  </table>`;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, username, country, amount, method, txnId, referredBy, date, referralUsername, level, changes, newPassword, reason, clientUsername, payerUsername, remaining, balance, time, receiptUrl } = req.body;

  const subjects = {
    activation_pending: `🚀 Hello ${username} 🎉`,
    activation: 'Your account is now activated ✅',
    activation_rejected: `Hello ${username}.`,
    stk_failed: `Hello ${username}.`,
    withdrawal_submitted: 'Withdraw Request 💵',
    withdrawal_approved: '🚀 Withdraw Processed 💵',
    withdrawal_rejected: 'Withdraw Request Update ❌',
    referral_level1: '🎉 you Earned a Referral Bonus 💲',
    referral_level2: '🎉 you Earned a Referral Bonus 💲',
    referral_level3: '🎉 you Earned a Referral Bonus 💲',
    deposit_pending: '💰 Deposit Request Received',
    deposit_approved: '✅ Deposit Approved',
    deposit_stk_success: '✅ Deposit Successful',
    deposit_stk_failed: '❌ Deposit Payment Failed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account',
    account_deactivated: '⛔ Your Account Has Been Deactivated',
    account_updated: '🔧 Your Account Details Were Updated',
    password_reset_by_admin: '🔐 Your Password Has Been Reset',
    client_payment_sent: 'Paid for Client ✅',
    client_payment_received: `Hello ${username}`
  };

  const emails = {
    activation_pending: renderEmail(
      `🚀 Hello ${username} 🎉`,
      p(`Dear ${username}, your transaction ID of "${txnId}" was successfully sent to admin. We will notify you once your account is activated.`),
      replyFooter
    ),

    activation: renderEmail(
      'Your account is activated ✅',
      p(`Hi ${username}, great news — your account has been reviewed and activated. You can now log in and start doing tasks. NETLINK AGENCIES 🎉`),
      replyFooter,
      '#00C853'
    ),

    activation_rejected: renderEmail(
      `Hello ${username}.`,
      p(`Dear ${username}, we weren't able to verify your payment. Please try again.`),
      replyFooter
    ),

    stk_failed: renderEmail(
      `Hello ${username}.`,
      p(`Dear ${username}, it looks like the M-PESA prompt was canceled and your account was not activated. Please try again or use manual activation.`),
      replyFooter
    ),

    withdrawal_submitted: renderEmail(
      'Withdraw Request 💵',
      p(`Dear ${username}, your withdraw request of ${amount} has been received.`) +
      receiptTable([
        ['Username', username],
        ['Amount Requested', amount],
        ['Date', date],
        ['Method', method],
        ['Estimated Time', '5-10 minutes'],
        ['Status', 'Pending']
      ]),
      replyFooter
    ),

    withdrawal_approved: renderEmail(
      '🚀 Withdraw Processed 💵',
      p(`Hi ${username}, your withdrawal was successfully approved.`) +
      receiptTable([
        ['Amount', amount],
        ['Method', method],
        ['Date', date],
        ['Time Taken', 'Processed instantly']
      ]),
      replyFooter
    ),

    withdrawal_rejected: renderEmail(
      'Withdraw Request Update',
      p(`Dear ${username}, your withdraw was rejected. The amount has been returned to your account balance.`),
      replyFooter
    ),

    referral_level1: renderEmail(
      'You Earned a Referral Bonus 🎉',
      p(`Hi ${username}, you've earned a referral commission!`) +
      receiptTable([
        ['Referral Username', referralUsername],
        ['Referral Commission', amount],
        ['Level', level],
        ['Activated On', date]
      ]),
      replyFooter
    ),

    referral_level2: renderEmail(
      'You Earned a Referral Bonus 🎉',
      p(`Hi ${username}, you've earned a referral commission!`) +
      receiptTable([
        ['Referral Username', referralUsername],
        ['Referral Commission', amount],
        ['Level', level],
        ['Activated On', date]
      ]),
      replyFooter
    ),

    referral_level3: renderEmail(
      'You Earned a Referral Bonus 🎉',
      p(`Hi ${username}, you've earned a referral commission!`) +
      receiptTable([
        ['Referral Username', referralUsername],
        ['Referral Commission', amount],
        ['Level', level],
        ['Activated On', date]
      ]),
      replyFooter
    ),

    deposit_pending: renderEmail(
      'Deposit Request Received 💰',
      p(`Dear ${username}, we've received your deposit submission of ${amount} (Transaction ID: ${txnId}). We will notify you once it's approved and credited to your account.`),
      replyFooter
    ),

    deposit_approved: renderEmail(
      'Deposit Approved ✅',
      p(`Hi ${username}, great news! Your deposit of ${amount} has been approved and credited to your Account Balance and Total Earnings.`),
      replyFooter,
      '#00C853'
    ),

    deposit_stk_success: renderEmail(
      'Deposit Successful ✅',
      p(`Hi ${username}, your M-Pesa payment was received successfully and has been credited to your Account Balance and Total Earnings.`) +
      receiptTable([
        ['Amount', amount],
        ['Transaction ID', txnId],
        ['Date', date]
      ]),
      replyFooter,
      '#00C853'
    ),

    deposit_stk_failed: renderEmail(
      'Deposit Payment Failed ❌',
      p(`Dear ${username}, your M-Pesa deposit prompt was canceled or failed, so ${amount} was not credited to your account. Please try again or use manual deposit.`),
      replyFooter
    ),

    new_referral: renderEmail(
      'New Referral! 🎉',
      p(`Hi ${username}, someone just joined using your referral link. New member: ${referredBy}, on ${date}.`),
      replyFooter
    ),

    karibu_bonus: renderEmail(
      'Bonus Credited! 🎁',
      p(`Hi ${username}, your Karibu bonus of ${amount} has been credited to your account.`),
      replyFooter
    ),

    account_deactivated: renderEmail(
      'Account Deactivated ⛔',
      p(`Hi ${username}, your account has been deactivated by an administrator.`) +
      (reason ? receiptTable([['Reason', reason]]) : '') +
      p(`You will not be able to access your dashboard until it is reactivated. If you believe this was a mistake, please contact support by replying to this email.`),
      replyFooter,
      '#FF3B3B'
    ),

    account_updated: renderEmail(
      'Account Details Updated 🔧',
      p(`Hi ${username}, an administrator made the following changes to your account:`) +
      receiptTable(changes || []),
      replyFooter
    ),

    password_reset_by_admin: renderEmail(
      'Password Reset 🔐',
      p(`Hi ${username}, your account password was reset by an administrator.`) +
      receiptTable([['New Password', newPassword]]) +
      p(`Please use this new password to log in. For your security, we recommend changing it again after logging in.`),
      replyFooter
    ),

    client_payment_sent: renderEmail(
      'Paid for Client ✅',
      p(`Dear ${username}, you've paid an activation fee of KSh ${amount} to ${clientUsername}. Here is your receipt:`) +
      receiptTable([
        ['Amount Paid', `KSh ${amount}`],
        ['Paid To', clientUsername],
        ['Time', time],
        ['Date', date],
        ['Your Account Balance', `KSh ${balance}`]
      ]) +
      (receiptUrl ? `<div style="text-align:center;margin:24px 0;"><a href="${receiptUrl}" style="display:inline-block;background:#E91E8C;color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">📄 View &amp; Download Receipt</a></div>` : ''),
      replyFooter,
      '#00C853'
    ),

    client_payment_received: renderEmail(
      `Hello ${username}`,
      p(`Dear ${username}, ${payerUsername} has paid KSh ${amount} for your activation fee.`) +
      receiptTable([
        [`Amount Paid By ${payerUsername}`, `KSh ${amount}`],
        ['Amount You Still Need To Pay', `KSh ${remaining}`],
        ['Time', time],
        ['Date', date]
      ]) +
      (Number(remaining) > 0 ?
        p(`<strong>You can complete your activation:</strong>`) +
        `<div style="background:#f5f5f5;border-radius:10px;padding:18px;margin:0 0 18px;font-size:14px;line-height:2;color:#333;">
          <p style="margin:0;"><strong>1.</strong> Go and log in to NETLINK AGENCIES using your username and password.</p>
          <p style="margin:0;"><strong>2.</strong> Choose Manual Payment.</p>
          <p style="margin:0;"><strong>3.</strong> Pay via Till.</p>
          <p style="margin:0;"><strong>4.</strong> Submit your Transaction ID.</p>
          <p style="margin:0;"><strong>5.</strong> Wait for admin to approve.</p>
        </div>`
        :
        p(`🎉 Your activation fee has been fully covered! Your account has been activated automatically — no further action needed.`)
      ),
      replyFooter,
      Number(remaining) > 0 ? undefined : '#00C853'
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
