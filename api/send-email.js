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
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer re_iQpayyRH_39ByPZ7MbAjdBPsdTWQaQj3d'
      },
      body: JSON.stringify({
        from: 'check <support@bundlesmwitu.linkpc.net>',
        to: [to],
        reply_to: 'nentlinkagencies254@gmail.com',
        subject: subjects[type],
        text: subjects[type] + ' - NETLINK AGENCIES',
        headers: {
          'List-Unsubscribe': '<mailto:nentlinkagencies254@gmail.com?subject=unsubscribe>',
          'X-Priority': '3',
          'X-Mailer': 'NETLINK AGENCIES Mailer'
        },
        html: `
          <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
            <div style="background:linear-gradient(135deg,#B0156A,#FF4DB8);padding:24px;border-radius:12px 12px 0 0;text-align:center;">
              <h1 style="color:#fff;margin:0;">🔗 NETLINK AGENCIES</h1>
            </div>
            <div style="background:#fff;padding:24px;border-radius:0 0 12px 12px;border:1px solid #eee;">
              ${bodies[type]}
              <hr style="border:none;border-top:1px solid #eee;margin:20px 0;"/>
              <p style="color:#aaa;font-size:12px;">NETLINK AGENCIES — <a href="https://netlinkagencies.linkpc.net">netlinkagencies.linkpc.net</a></p>
            </div>
          </div>`
      })
    });

    const data = await response.json();
    if (data.id) return res.status(200).json({ success: true, id: data.id });
    else return res.status(500).json({ error: data.message || 'Failed' });

  } catch (err) {
    console.error('Error:', err.message);
    return res.status(500).json({ error: err.message });
  }
    }
