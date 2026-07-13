import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,        // your full gmail address
    pass: process.env.GMAIL_APP_PASSWORD // 16-char app password (no spaces)
  }
});

const senderName = 'NETLINK AGENCIES';
const replyFooter = "Regards, NETLINK AGENCIES Team";

function renderEmail(heading, bodyHtml, footer, headingColor) {
  return `
  <div style="background-color:#121212;padding:32px 0;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:520px;margin:0 auto;border-radius:18px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,0.5);">
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#E91E8C,#FF4DB8);padding:28px 24px;text-align:center;">
        <h1 style="margin:0 0 8px;color:#fff;font-size:20px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">NETLINK AGENCIES</h1>
        <h2 style="margin:0;color:rgba(255,255,255,0.92);font-size:15px;font-weight:700;letter-spacing:0.5px;">${heading}</h2>
      </div>
      <!-- Body -->
      <div style="background:#1e1e1e;padding:32px 28px;">
        ${bodyHtml}
      </div>
      <!-- Footer -->
      <div style="background:#181818;padding:20px 28px;border-top:1px solid #2a2a2a;text-align:center;">
        <p style="margin:0 0 4px;font-size:13px;color:#aaa;font-weight:600;">${footer}</p>
        <p style="margin:0 0 4px;font-size:12px;color:#666;">Happy Networking with NETLINK AGENCIES</p>
        <p style="margin:0;font-size:11px;color:#555;">&copy;2026 NETLINK AGENCIES Inc</p>
      </div>
    </div>
  </div>`;
}

function p(text) {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#cccccc;">${text}</p>`;
}

function receiptTable(rows) {
  return `<table style="width:100%;border-collapse:collapse;margin:0 0 20px;font-size:14px;">
    ${rows.map(([k, v]) => `<tr><td style="padding:8px 0;color:#888;border-bottom:1px solid #2a2a2a;">${k}</td><td style="padding:8px 0;text-align:right;font-weight:700;color:#ffffff;border-bottom:1px solid #2a2a2a;">${v}</td></tr>`).join('')}
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
    activation: `Welcome to NETLINK AGENCIES — Your Account is now activated! 🎉`,
    activation_rejected: `Hello ${username}.`,
    stk_failed: `Hello ${username}.`,
    withdrawal_submitted: 'Withdraw Request 🚀',
    withdrawal_approved: 'Withdraw Approved — Congratulations 🎉',
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
    client_payment_received: `NETLINK AGENCIES XCY`,
    password_reset: 'NETLINK AGENCIES Reset Password',
    full_guidance: `📘 Your Full NETLINK AGENCIES Guidance`
  };

  const emails = {
    activation_pending: renderEmail(
      `🚀 Hello ${username} 🎉`,
      p(`Dear ${username}, your transaction ID of "${txnId}" was successfully sent to admin. We will notify you once your account is activated.`),
      replyFooter
    ),

    activation: renderEmail(
      'Your Account is Activated 🎉',
      p(`Hi <strong style="color:#fff;">${username}</strong>, your NETLINK AGENCIES account is ready. You can now log in to your account and start earning.`) +
      `<div style="text-align:left;margin-top:20px;"><a href="${req.body.dashboardLink || 'https://netlinkagencies.linkpc.net'}" style="display:inline-block;background:linear-gradient(135deg,#E91E8C,#FF4DB8);color:#fff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:14px;">Open Dashboard →</a></div>`,
      replyFooter
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
      p(`Dear ${username}, your withdraw request has been received.`) +
      receiptTable([
        ['Username', username],
        ['Amount Requested', amount],
        ['Amount You Will Receive', req.body.receive || amount],
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
        ['Amount Requested', amount],
        ['Amount Sent to You', req.body.receive || amount],
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

    full_guidance: renderEmail(
      `📘 Welcome to NETLINK AGENCIES, ${username}!`,
      p(`Welcome aboard! Now that your account is active, here is your complete guide to every page on NETLINK AGENCIES and exactly how to use each one to start earning right away. This is a long, detailed guide on purpose — read it once fully, then keep it saved so you can come back to any section whenever you need a refresher. Everything you need to succeed on the platform is covered here, page by page.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">1. Your Home Dashboard — Your Command Center</h3>` + p(`Every time you log in, this is the first page you land on, and it is designed to give you a complete snapshot of your financial standing in seconds. At the top, you will see your Expenses and Total Earnings side by side, followed by your Account Balance, which shows exactly how much is available for withdrawal right now. Below that, your Withdrawn Amount and Pending Amount let you track money that has already left your account versus money still being processed.`) + p(`Your Karibu Bonus and Weekly Bonus cards show any welcome or recurring rewards you have earned. Scroll further down and you will find your personal referral link, ready to copy with one tap and share directly to WhatsApp, Facebook, or Telegram using the built-in share buttons — no need to manually copy and paste into each app separately.`) + p(`At the very top right of every page, the notification bell keeps you updated in real time about withdrawal approvals, deposit confirmations, and responses to any requests you have submitted, so you never have to guess what is happening with your account. Make checking your Home Dashboard part of your daily routine — it is the fastest way to understand where you stand and what to do next.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">2. Daily Earning Tasks — Where Most of Your Income Comes From</h3>` + p(`NETLINK gives you several distinct ways to earn every single day, and understanding each one well will directly increase your income.`) + p(`TikTok Videos, Instagram Videos, and YouTube Videos each let you watch three short videos daily. Simply tap into the page, press play, and watch the full duration of each video — your earnings are credited automatically to your Total Earnings the moment a video finishes. These three pages combined can be completed in just a few minutes and are the easiest way to build a consistent daily earning habit.`) + p(`Trivia Quiz, Daily Survey, and Math Quiz each open a fresh set of six questions every single week, and the content genuinely changes — you will not see the same questions repeating for many months. Answer all six questions correctly within the given time limit to earn KES 50 for every correct answer, meaning a perfect score nets you KES 300 from a single quiz type. Each quiz has a specific day of the week it becomes available, so check the Time Table page to know exactly when to come back for each one — missing the day means waiting a full week for the next opportunity.`) + p(`Number Game is a quick daily game that tests your luck and quick thinking for additional earnings, perfect for a short break between other tasks.`) + p(`Company Advert shows you rotating advertisements from real sponsor brands — Safaricom, Jumia, KCB Bank, Equity Bank, Naivas, and dozens more — and pays you a small amount simply for viewing each one for the required time. Many of these ads also include a genuine "Shop Now" or "Learn More" button that takes you directly to the real company website, so if something catches your eye, you can explore the actual offer.`) + p(`WhatsApp Adverts works differently from the rest. Once a week, you are given a company advert image to post directly to your own WhatsApp status. Every single contact who views that status earns you money — so the larger your WhatsApp contact list, the more this one weekly post can earn you. This is one of the highest-leverage earning opportunities on the entire platform because it scales with your existing network for almost zero extra effort.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">3. Growing Your Network — Your Long-Term Income Engine</h3>` + p(`While daily tasks give you steady income, your referral network is what builds real long-term wealth on NETLINK, because it keeps paying you even on days you do not log in at all.`) + p(`Your personal referral link, found on your Home Dashboard, is the single most valuable tool you have. Every person who creates an account using your link becomes your Level 1 referral, and the moment their account gets activated — whether they pay for it themselves, an admin approves it manually, or someone pays for them through Pay for Clients — you instantly earn KES 80. If those Level 1 referrals go on to invite their own friends, those new members become your Level 2 referrals, earning you KES 20 each. And if that second group refers even more people, those become your Level 3 referrals, earning you KES 10 each. This three-level structure means a single active referral can quietly generate income for you for months or years as their own network grows beneath them.`) + p(`Downlines is actually three separate pages — one each for Level 1, Level 2, and Level 3 — where you can see exactly who is in each tier of your network by username. Use these pages to track your team's growth, identify your most active referrals, and know who to encourage to stay engaged.`) + p(`E-Tournaments and Betting Prediction round out the platform's engagement features, giving you the chance to participate in competitions and prediction challenges for additional rewards beyond your regular earning routine.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">4. Money Pages — Deposit, Cashout, and Pay for Clients</h3>` + p(`These three pages handle everything related to moving money in and out of your account, and each one deserves careful attention since real funds are involved.`) + p(`Deposit is where you add money to your account balance if you want to accelerate your earning potential. Once deposited, those funds become available for features like Forex Trading, where you can attempt to grow your balance further through trading activity directly within the platform.`) + p(`Cashout is where you request a withdrawal of your earnings to M-PESA or PayPal. There is a minimum withdrawal threshold shown clearly on the page, and once you submit a request, it appears immediately in your Withdrawal History section below the form — every single request you have ever made is listed there with its exact amount, the method used, the date and time submitted, and a clear color-coded status: Pending (still being processed), Successful (money has been sent), or Rejected (request was declined, with your balance automatically restored). If you ever notice the phone number displayed for receiving payment is incorrect, tap the "Verify Me" button, which takes you straight to your Profile page where you can submit an official request to have it corrected.`) + p(`Pay for Clients is one of the more unique features on NETLINK. It allows you to help a friend or any other member get their account activated by paying their activation fee directly from your own balance — either fully in one payment or partially, letting them complete the remaining balance themselves later through their own activation page. Importantly, if you are that person's referrer, you still earn your full referral commission the moment their account becomes activated this way, exactly as if they had paid for themselves. Every payment you make generates an official downloadable receipt carrying your logo and full transaction details, including a clear reminder that these payments cannot be reversed once completed — so always double-check the username you are paying for before confirming the transaction.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">5. Karibu Bonus, Mentorship, Community, and Support</h3>` + p(`Karibu Bonus is a special welcome reward unlocked once you have referred a set number of new members — the page shows your live progress toward that target along with a claim button that activates automatically once you qualify.`) + p(`Mentorship is your go-to page for leveling up your strategy. It includes an in-depth breakdown of exactly how NETLINK works from the ground up, plus practical tips from experienced top earners covering everything from building your referral network to maximizing your daily task completion. If you ever feel unsure about the best way to grow your income, start here.`) + p(`Community connects you with other NETLINK members so you can share tips, celebrate milestones together, and stay motivated as a group rather than earning in isolation. Successful earners consistently point to community engagement as a key factor in staying consistent long-term.`) + p(`Get Help answers the most common questions members have, and is often the fastest way to solve a simple issue without needing to contact anyone directly. Time Table is a simple but essential reference page showing exactly which day of the week each rotating task — TikTok videos, Trivia Quiz, Daily Survey, Math Quiz, and WhatsApp Adverts — becomes newly available, so you can plan your week and never miss a task window.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FF80CE;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">6. Article and Profile — Learning and Managing Your Account</h3>` + p(`Article delivers fresh educational content every single week, covering practical topics like budgeting on irregular income, building an emergency fund, avoiding online scams, growing a personal brand, understanding referral psychology, and building long-term financial discipline. New articles rotate in on a weekly cycle, so it is genuinely worth checking back regularly rather than reading once and forgetting about this page.`) + p(`Profile is where all of your personal account information lives — your username, email, phone number, WhatsApp number, and country are all displayed clearly here. You can upload a profile picture directly from this page by tapping the small camera icon on your avatar; once uploaded, your photo will appear across every page on the dashboard, replacing the default letter icon. If you ever need to change your phone number, correct any account detail, or raise any other issue, use the "Submit a Request" form on this page — pick a quick subject or write your own, describe your request clearly, and submit it. You will immediately receive a unique 13-character tracking ID starting with the letter N, and the moment an admin approves or rejects your request, you will be notified both by email and directly on your dashboard notification bell.`) +
      `<h3 style="margin:28px 0 10px;font-size:16px;font-weight:900;color:#FFD700;border-bottom:1px solid #2a2a2a;padding-bottom:8px;">Your Quick-Start Checklist</h3>` + p(`To summarize everything above into simple daily and weekly habits: log in every day and complete your TikTok, Instagram, and YouTube video tasks. Check the Time Table page so you know exactly which quiz, survey, or advert becomes available each day, and complete it the moment it unlocks. Post your WhatsApp Advert once a week without fail, since it is one of your highest-value earning opportunities. Spend a few minutes daily sharing your referral link and following up with people who have already joined, since an active network compounds your income far beyond what daily tasks alone can achieve. Check your Home Dashboard notification bell regularly so you never miss an important update, and read the new Article each week to keep sharpening your financial knowledge.`) +
      p(`That covers every single page on your NETLINK AGENCIES dashboard, from your very first login to your long-term earning strategy. The members who succeed fastest are rarely the ones who work in short, intense bursts — they are the ones who build a simple, consistent daily and weekly routine and stick to it. Log in, complete your tasks, check for new weekly content, and spend time growing your network. Do this consistently, and your Total Earnings, Account Balance, and referral network will all compound together over the coming weeks and months.`) + p(`Welcome to the NETLINK AGENCIES family — we are genuinely glad to have you here, and we are rooting for your success.`),
      replyFooter,
      '#E91E8C'
    ),

    password_reset: renderEmail(
      'Reset Your Password 🔐',
      p(`<em style="color:#888;">This is an automatically generated email, please do not reply.</em>`) +
      p(`To change your password, use the link below to reset your password. This link expires after <strong style="color:#fff;">48 hours</strong>.`) +
      `<div style="text-align:center;margin:28px 0;">
        <a href="${req.body.resetLink}" style="display:inline-block;background:linear-gradient(135deg,#E91E8C,#FF4DB8);color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">Reset Password</a>
      </div>` +
      p(`If you did not request this change, please ignore this message.`) +
      `<div style="margin-top:24px;padding-top:16px;border-top:1px solid #2a2a2a;">
        <p style="margin:0 0 4px;font-size:13px;color:#aaa;">Best Regards,</p>
        <p style="margin:0 0 4px;font-size:13px;color:#fff;font-weight:700;">NETLINK AGENCIES Team</p>
        <p style="margin:0;font-size:12px;color:#888;">NETLINK AGENCIES Help Center: <a href="http://netlinkagencies.linkpc.net/support" style="color:#E91E8C;text-decoration:none;">netlinkagencies.linkpc.net/support</a></p>
      </div>`,
      replyFooter,
      '#E91E8C'
    ),

    client_payment_received: renderEmail(
      `Hello ${username}`,
      p(`Hello <strong style="color:#fff;">${username}</strong>,`) +
      p(`Good news, your friend <strong style="color:#fff;">${payerUsername}</strong> has paid <strong style="color:#fff;">KSh ${amount}</strong> for your account activation fee.`) +
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
