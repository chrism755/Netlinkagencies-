export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { type, to, username, country, amount, method, txnId, referredBy, date } = req.body;

  const subjects = {
    activation: 'Account Activation Confirmed',
    activation_pending: 'Payment Confirmation',
    withdrawal_submitted: 'Withdrawal Request Received',
    withdrawal_approved: 'Withdrawal Processed',
    new_referral: 'New Referral Alert',
    karibu_bonus: 'Bonus Credited to Your Account'
  };

  const bodies = {
    activation_pending: `<p>Hi <strong>${username}</strong>,</p><p>We have received your payment with Transaction ID: <strong>${txnId}</strong>.</p><p>Your account will be activated within <strong>2-5 minutes</strong>.</p><p>If not activated within 5 minutes please contact admin on WhatsApp.</p>`,
    activation: `<p>Hi <strong>${username}</strong>,</p><p>Your account has been activated!</p><p>Username: ${username}<br/>Country: ${country}<br/>Date: ${date}</p><p><a href="https://netlinkagencies.linkpc.net/dashboard">Go to Dashboard</a></p>`,
    withdrawal_submitted: `<p>Hi <strong>${username}</strong>,</p><p>Your withdrawal request has been received.<br/>Amount: ${amount}<br/>Method: ${method}<br/>Date: ${date}</p><p>Please wait 24-48 hours.</p>`,
    withdrawal_approved: `<p>Hi <strong>${username}</strong>,</p><p>Your withdrawal of <strong>${amount}</strong> has been processed via ${method}.</p>`,
    new_referral: `<p>Hi <strong>${username}</strong>,</p><p>Someone just joined using your referral link!<br/>New Member: ${referredBy}<br/>Date: ${date}</p>`,
    karibu_bonus: `<p>Hi <strong>${username}</strong>,</p><p>Your Karibu bonus of <strong>${amount}</strong> has been credited!</p>`
  };

  if (!subjects[type]) return res.status(400).json({ error: 'Invalid type' });

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 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'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: 'cmuchui534@gmail.com', name: 'NETLINK AGENCIES' },
        reply_to: { email: 'nentlinkagencies254@gmail.com' },
        subject: subjects[type],
        content: [
          {
            type: 'text/html',
            value: `
              <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
                <div style="background:linear-gradient(135deg,#B0156A,#FF4DB8);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                  <h1 style="color:#fff;margin:0;">NETLINK AGENCIES</h1>
                </div>
                <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;">
                  ${bodies[type]}
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
                  <p style="color:#aaa;font-size:12px;">NETLINK AGENCIES</p>
                </div>
              </div>`
          }
        ]
      })
    });

    console.log('SendGrid status:', response.status);
    if (response.status === 202) {
      return res.status(200).json({ success: true });
    } else {
      const data = await response.json();
      console.log('SendGrid error:', data);
      return res.status(500).json({ error: data.errors?.[0]?.message || 'Failed' });
    }

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
