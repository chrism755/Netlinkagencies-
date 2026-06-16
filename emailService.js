const nodemailer = require("nodemailer");

// Configure Gmail with your email
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER || "netlinkagencies254@gmail.com",
    pass: process.env.GMAIL_PASSWORD || "", // Use App Password from Google
  },
});

// Email templates
const emailTemplates = {
  accountActivated: (username, email) => ({
    to: email,
    from: "netlinkagencies254@gmail.com",
    subject: "Account Activated Successfully! 🎉",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #007bff;">
          <h2 style="color: #007bff; margin: 0;">Welcome to Netlink Agencies!</h2>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 16px;">Your account has been successfully <strong>activated</strong>! 🎉</p>
          
          <p style="font-size: 16px; margin-top: 20px;">You can now:</p>
          <ul style="font-size: 16px; line-height: 1.8;">
            <li>✅ Complete tasks and earn money</li>
            <li>✅ Refer others and earn commissions</li>
            <li>✅ Withdraw your earnings</li>
            <li>✅ Track your progress on the dashboard</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go to Dashboard</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you didn't create this account, please contact our support team immediately.</p>
        </div>
        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Best regards,<br><strong>Netlink Agencies Team</strong></p>
          <p>© 2026 Netlink Agencies. All rights reserved.</p>
        </div>
      </div>
    `,
  }),

  taskEarnings: (username, email, amount, taskName) => ({
    to: email,
    from: "netlinkagencies254@gmail.com",
    subject: `You earned $${amount} from a task! 💰`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #28a745;">
          <h2 style="color: #28a745; margin: 0;">Great Job! 💰</h2>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 16px;">Congratulations! You have earned <strong style="color: #28a745; font-size: 20px;">$${amount}</strong> from completing a task!</p>
          
          <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
            <p style="margin: 0; font-size: 16px;"><strong>Task:</strong> ${taskName}</p>
          </div>
          
          <p style="font-size: 16px;">Your new balance has been updated and is available in your dashboard.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Earnings</a>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">Keep completing tasks to earn more! 🚀</p>
        </div>
        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Best regards,<br><strong>Netlink Agencies Team</strong></p>
        </div>
      </div>
    `,
  }),

  newReferral: (username, email, referralName, bonus) => ({
    to: email,
    from: "netlinkagencies254@gmail.com",
    subject: `New Referral Bonus! 🚀 +$${bonus}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #ffc107;">
          <h2 style="color: #ffc107; margin: 0;">Referral Bonus Earned! 🚀</h2>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 16px;">Great news! <strong>${referralName}</strong> just joined using your referral link!</p>
          
          <div style="background-color: #fffbf0; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p style="margin: 0; font-size: 18px;"><strong>You earned: $${bonus}</strong></p>
          </div>
          
          <p style="font-size: 16px;">Keep referring friends and family to earn even more commissions!</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #ffc107; color: black; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Share Your Link</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">📊 Track your referrals and earnings in your dashboard!</p>
        </div>
        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Best regards,<br><strong>Netlink Agencies Team</strong></p>
        </div>
      </div>
    `,
  }),

  withdrawalProcessed: (username, email, amount, method) => ({
    to: email,
    from: "netlinkagencies254@gmail.com",
    subject: `Withdrawal Processed Successfully ✅`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #17a2b8;">
          <h2 style="color: #17a2b8; margin: 0;">Withdrawal Confirmed ✅</h2>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 16px;">Your withdrawal request has been <strong>successfully processed</strong>!</p>
          
          <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p style="margin: 5px 0; font-size: 16px;"><strong>Amount:</strong> $${amount}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Method:</strong> ${method}</p>
            <p style="margin: 5px 0; font-size: 16px;"><strong>Status:</strong> Processing</p>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">⏱️ The funds should appear in your account within <strong>1-3 business days</strong> depending on your payment method.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Dashboard</a>
          </div>
          
          <p style="font-size: 14px; color: #666; margin-top: 20px;">If you have any questions about your withdrawal, please contact our support team.</p>
        </div>
        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Best regards,<br><strong>Netlink Agencies Team</strong></p>
        </div>
      </div>
    `,
  }),

  levelBonus: (username, email, level, amount) => ({
    to: email,
    from: "netlinkagencies254@gmail.com",
    subject: `Level ${level} Referral Bonus! 🎁 +$${amount}`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
        <div style="text-align: center; padding-bottom: 20px; border-bottom: 2px solid #dc3545;">
          <h2 style="color: #dc3545; margin: 0;">Referral Bonus Earned! 🎁</h2>
        </div>
        <div style="padding: 20px 0;">
          <p style="font-size: 16px;">Dear <strong>${username}</strong>,</p>
          <p style="font-size: 16px;">You received a <strong>Level ${level} referral bonus</strong>!</p>
          
          <div style="background-color: #ffe8e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0; font-size: 18px;"><strong>Bonus Amount: $${amount}</strong></p>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">One of your referrals (or their referrals) completed a task, and you earned a commission!</p>
          
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Referral Level:</strong> Level ${level}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Commission:</strong> $${amount}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Status:</strong> Added to your balance</p>
          </div>
          
          <p style="font-size: 16px; margin-top: 20px;">Keep building your network to earn more commissions! 🌟</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://netlinkagencies.vercel.app/dashboard" style="background-color: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Referrals</a>
          </div>
        </div>
        <div style="border-top: 2px solid #f0f0f0; padding-top: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>Best regards,<br><strong>Netlink Agencies Team</strong></p>
        </div>
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
        console.log("❌ Unknown email type:", type);
        return false;
    }

    await transporter.sendMail(emailConfig);
    console.log(`✅ Email sent: ${type} to ${userData.email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}

module.exports = { sendEmail };
