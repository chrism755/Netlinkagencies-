const nodemailer = require("nodemailer");

// Configure your email service (Gmail, SendGrid, etc.)
// For Gmail, enable 2FA and generate an app password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your email (set in Firebase functions config)
    pass: process.env.EMAIL_PASSWORD, // Your app password (set in Firebase functions config)
  },
});

// Email templates
const emailTemplates = {
  accountActivated: (username, email) => ({
    to: email,
    subject: "Account Activated Successfully! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Welcome, ${username}!</h2>
        <p>Your account has been successfully activated.</p>
        <p>You can now:</p>
        <ul>
          <li>Complete tasks and earn money</li>
          <li>Refer others and earn commissions</li>
          <li>Withdraw your earnings</li>
        </ul>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Go to Dashboard</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  taskEarnings: (username, email, amount, taskName) => ({
    to: email,
    subject: `You earned $${amount} from a task! 💰`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Congratulations, ${username}!</h2>
        <p>You have earned <strong>$${amount}</strong> from completing the task:</p>
        <p style="background-color: #f0f0f0; padding: 10px; border-radius: 5px;"><strong>${taskName}</strong></p>
        <p>Your new balance is available in your dashboard.</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Earnings</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  newReferral: (username, email, referralName, bonus) => ({
    to: email,
    subject: `New Referral Bonus! 🚀 +$${bonus}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Great news, ${username}!</h2>
        <p><strong>${referralName}</strong> just joined using your referral link!</p>
        <p>You earned a bonus of <strong>$${bonus}</strong></p>
        <p>Keep referring to earn more!</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #ffc107; color: black; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Share Your Link</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  withdrawalProcessed: (username, email, amount, method) => ({
    to: email,
    subject: `Withdrawal Processed Successfully ✅`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Withdrawal Confirmed, ${username}!</h2>
        <p>Your withdrawal request has been processed.</p>
        <p><strong>Amount:</strong> $${amount}</p>
        <p><strong>Method:</strong> ${method}</p>
        <p>The funds should appear in your account within 1-3 business days.</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #17a2b8; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Transaction</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),

  levelBonus: (username, email, level, amount) => ({
    to: email,
    subject: `Level ${level} Referral Bonus! 🎁 +$${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
        <h2>Referral Bonus Earned, ${username}!</h2>
        <p>You received a <strong>Level ${level} referral bonus</strong> of <strong>$${amount}</strong></p>
        <p>One of your referrals (or their referrals) completed a task, and you earned a commission!</p>
        <p>Keep building your network to earn more!</p>
        <p><a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Referrals</a></p>
        <p>Best regards,<br>Netlink Agencies Team</p>
      </div>
    `,
  }),
};

// Send email function
async function sendEmail(type, userData, additionalData = {}) {
  try {
    let emailConfig;

    switch (type) {
      case "accountActivated":
        emailConfig = emailTemplates.accountActivated(userData.username, userData.email);
        break;
      case "taskEarnings":
        emailConfig = emailTemplates.taskEarnings(
          userData.username,
          userData.email,
          additionalData.amount,
          additionalData.taskName
        );
        break;
      case "newReferral":
        emailConfig = emailTemplates.newReferral(
          userData.username,
          userData.email,
          additionalData.referralName,
          additionalData.bonus
        );
        break;
      case "withdrawalProcessed":
        emailConfig = emailTemplates.withdrawalProcessed(
          userData.username,
          userData.email,
          additionalData.amount,
          additionalData.method
        );
        break;
      case "levelBonus":
        emailConfig = emailTemplates.levelBonus(
          userData.username,
          userData.email,
          additionalData.level,
          additionalData.amount
        );
        break;
      default:
        console.log("Unknown email type");
        return;
    }

    await transporter.sendMail(emailConfig);
    console.log(`Email sent: ${type} to ${userData.email}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendEmail };
