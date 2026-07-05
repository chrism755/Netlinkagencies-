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

const db = admin.firestore();

// ═══════════════════════════════════════
// EMAIL — used for the deactivation confirmation code (sent as "Netlink Auth")
// Reuses the same Gmail credentials as api/send-email.js
// ═══════════════════════════════════════
const codeMailer = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

function generateCode() {
  // 8-digit numeric code
  return String(Math.floor(10000000 + Math.random() * 90000000));
}

function maskEmail(email) {
  const [name, domain] = String(email || '').split('@');
  if (!domain) return email || '';
  const visible = name.slice(0, 2);
  return `${visible}${'*'.repeat(Math.max(1, name.length - 2))}@${domain}`;
}

async function sendCodeEmail(to, username, code) {
  await codeMailer.sendMail({
    from: `"Netlink Auth" <${process.env.GMAIL_USER}>`,
    to,
    subject: '🔐 Your Netlink Agencies Deactivation Code',
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;">Deactivation Verification Code</h2>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">Hi ${username}, someone requested to deactivate your NETLINK AGENCIES account via the support bot. Use this code to confirm it's you:</p>
      <p style="font-size:28px;font-weight:800;letter-spacing:4px;text-align:center;margin:20px 0;">${code}</p>
      <p style="margin:0 0 18px;font-size:14px;color:#666;">This code expires in 10 minutes. If you didn't request this, ignore this email — your account will remain active.</p>
    </div>`
  });
}

// ═══════════════════════════════════════
// CONVERSATION STATE — stored in Firestore so it survives across requests
// ═══════════════════════════════════════
async function getChatState(chatId) {
  const snap = await db.collection('botChatState').doc(String(chatId)).get();
  return snap.exists ? snap.data() : { step: null, data: {} };
}
async function setChatState(chatId, state) {
  await db.collection('botChatState').doc(String(chatId)).set(state);
}
async function clearChatState(chatId) {
  await db.collection('botChatState').doc(String(chatId)).delete();
}

// ═══════════════════════════════════════
// INTENT MATCHING — recognizes natural phrases, not exact commands
// ═══════════════════════════════════════
function matchIntent(msg) {
  const t = msg.toLowerCase();

  if (/\b(hi|hello|hey|start|menu)\b/.test(t) && t.length < 20) return 'greeting';

  if (/(not activated|isn'?t activated|account.*not.*active|activate my account|how (do i|to) activate|need to activate)/.test(t)) return 'activate_account';

  if (/(deactivate|suspend|disable).*account/.test(t)) return 'deactivate_account';

  if (/(check|what'?s|whats|see).*(status|balance)|my balance|how much.*(have|earn)/.test(t)) return 'check_balance';

  if (/(referral link|invite link|my link|refer.*friend|how.*refer)/.test(t)) return 'referral_link';

  if (/(how.*works|guide me|explain|how do i (use|start|earn)|help me understand|what is this|how to use)/.test(t)) return 'how_it_works';

  if (/(register|sign ?up|create.*account|join)/.test(t)) return 'register_link';

  if (/(login|log in|sign in)/.test(t)) return 'login_link';

  if (/(withdraw|cash ?out|get my money|take out money)/.test(t)) return 'withdraw_link';

  if (/(reset|forgot).*(password)/.test(t)) return 'reset_password';

  if (/(approve|accept).*(withdraw|withdrawal)/.test(t)) return 'approve_withdrawal';

  if (/(reject|decline|deny).*(withdraw|withdrawal)/.test(t)) return 'reject_withdrawal';

  if (/(pending|list).*(activation|withdrawal)/.test(t)) return 'list_pending';

  if (/(links|all links|show.*links|website links)/.test(t)) return 'get_links';

  return 'unknown';
}

// Detect if a free-text reply looks like a username (alphanumeric, no spaces, reasonable length)
function looksLikeUsername(msg) {
  const t = msg.trim();
  return /^[a-zA-Z0-9_.]{3,30}$/.test(t) && !/\s/.test(t);
}

async function lookupUserByUsername(username) {
  const snap = await db.collection('users').where('username', '==', username).limit(1).get();
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// ═══════════════════════════════════════
// MAIN CHAT HANDLER
// ═══════════════════════════════════════
async function handleChat(chatId, message, platform) {
  const state = await getChatState(chatId);

  // ── If we're mid-conversation waiting for specific info ──
  if (state.step === 'awaiting_username_for_activate') {
    if (!looksLikeUsername(message)) {
      return { text: "That doesn't look like a valid username. Please send just your username (no spaces)." };
    }
    const user = await lookupUserByUsername(message);
    if (!user) {
      await clearChatState(chatId);
      return { text: `I couldn't find an account with username "${message}". Please check the spelling or register here: https://netlinkagencies.linkpc.net/register` };
    }
    if (user.activated) {
      await clearChatState(chatId);
      return { text: `Good news — ${user.username}'s account is already activated! Dashboard: https://netlinkagencies.linkpc.net/dashboard` };
    }
    await db.collection('users').doc(user.id).update({ activated: true, activationMethod: 'bot' });
    await clearChatState(chatId);
    return { text: `✅ Done! ${user.username}'s account has been activated. They can now log in and start earning: https://netlinkagencies.linkpc.net/dashboard` };
  }

  if (state.step === 'awaiting_username_for_balance') {
    if (!looksLikeUsername(message)) {
      return { text: "That doesn't look like a valid username. Please send just your username." };
    }
    const user = await lookupUserByUsername(message);
    await clearChatState(chatId);
    if (!user) return { text: `No account found with username "${message}".` };
    return { text: `💰 ${user.username}'s balance: KES ${user.balance || 0}\nTotal earnings: KES ${user.totalEarnings || 0}\nWithdrawn: KES ${user.withdrawn || 0}\nPending: KES ${user.pending || 0}` };
  }

  if (state.step === 'awaiting_username_for_referral') {
    if (!looksLikeUsername(message)) {
      return { text: "That doesn't look like a valid username. Please send just your username." };
    }
    const user = await lookupUserByUsername(message);
    await clearChatState(chatId);
    if (!user) return { text: `No account found with username "${message}".` };
    return { text: `🔗 ${user.username}'s referral link:\nhttps://netlinkagencies.linkpc.net/register?ref=${user.referralCode || user.username}\n\nLevel 1: ${user.level1Count||0} · Level 2: ${user.level2Count||0} · Level 3: ${user.level3Count||0}` };
  }

  if (state.step === 'awaiting_username_for_deactivate') {
    if (!looksLikeUsername(message)) {
      return { text: "That doesn't look like a valid username. Please send just your username." };
    }
    const user = await lookupUserByUsername(message);
    if (!user) {
      await clearChatState(chatId);
      return { text: `No account found with username "${message}".` };
    }
    await db.collection('users').doc(user.id).update({ activated: false, deactivatedAt: admin.firestore.FieldValue.serverTimestamp() });
    await clearChatState(chatId);
    return { text: `✅ ${user.username}'s account has been deactivated.` };
  }

  if (state.step === 'awaiting_withdrawal_id') {
    const action = state.data.pendingAction; // 'approve' or 'reject'
    const wid = message.trim();
    try {
      await db.collection('pendingWithdrawals').doc(wid).update({ status: action === 'approve' ? 'approved' : 'rejected' });
      await clearChatState(chatId);
      return { text: `✅ Withdrawal ${wid} has been ${action === 'approve' ? 'approved' : 'rejected'}.` };
    } catch (e) {
      await clearChatState(chatId);
      return { text: `❌ Could not find or update withdrawal with ID "${wid}".` };
    }
  }

  // ── Fresh message — detect intent ──
  const intent = matchIntent(message);

  switch (intent) {
    case 'greeting':
      return { text: `👋 Hi! I'm the NETLINK AGENCIES assistant. I can help you:\n• Check your balance\n• Activate your account\n• Get your referral link\n• Learn how the site works\n• Withdraw money\n\nJust tell me what you need in your own words!` };

    case 'activate_account':
      await setChatState(chatId, { step: 'awaiting_username_for_activate', data: {} });
      return { text: `I can help activate the account. What is the username?` };

    case 'deactivate_account':
      await setChatState(chatId, { step: 'awaiting_username_for_deactivate', data: {} });
      return { text: `Which username should I deactivate?` };

    case 'check_balance':
      await setChatState(chatId, { step: 'awaiting_username_for_balance', data: {} });
      return { text: `Sure! What's the username so I can check the balance?` };

    case 'referral_link':
      await setChatState(chatId, { step: 'awaiting_username_for_referral', data: {} });
      return { text: `What's the username so I can get their referral link?` };

    case 'how_it_works':
      return { text: `📖 Here's how NETLINK AGENCIES works:\n\n1️⃣ Register — create a free account\nhttps://netlinkagencies.linkpc.net/register\n\n2️⃣ Activate — pay a one-time fee (KES 150) via M-Pesa\nhttps://netlinkagencies.linkpc.net/activate\n\n3️⃣ Earn — complete tasks, surveys, quizzes, watch adverts, invite friends\nhttps://netlinkagencies.linkpc.net/dashboard\n\n4️⃣ Withdraw — cash out to M-Pesa or PayPal\nhttps://netlinkagencies.linkpc.net/dashboard/cashout` };

    case 'register_link':
      return { text: `📝 Register here: https://netlinkagencies.linkpc.net/register` };

    case 'login_link':
      return { text: `🔐 Login here: https://netlinkagencies.linkpc.net/login` };

    case 'withdraw_link':
      return { text: `💸 Withdraw here: https://netlinkagencies.linkpc.net/dashboard/cashout` };

    case 'reset_password':
      return { text: `🔑 Reset your password here: https://netlinkagencies.linkpc.net/resetpassword` };

    case 'approve_withdrawal':
      await setChatState(chatId, { step: 'awaiting_withdrawal_id', data: { pendingAction: 'approve' } });
      return { text: `What's the withdrawal ID to approve? (Find it in /admin/withdraw)` };

    case 'reject_withdrawal':
      await setChatState(chatId, { step: 'awaiting_withdrawal_id', data: { pendingAction: 'reject' } });
      return { text: `What's the withdrawal ID to reject?` };

    case 'list_pending': {
      const snap = await db.collection('pendingWithdrawals').where('status', '==', 'pending').limit(10).get();
      if (snap.empty) return { text: `No pending withdrawals right now.` };
      const list = snap.docs.map(d => `• ${d.id}: ${d.data().username || ''} — KES ${d.data().amount || 0}`).join('\n');
      return { text: `📋 Pending withdrawals:\n${list}` };
    }

    case 'get_links':
      return { text: `🔗 Useful links:\nRegister: https://netlinkagencies.linkpc.net/register\nLogin: https://netlinkagencies.linkpc.net/login\nActivate: https://netlinkagencies.linkpc.net/activate\nDashboard: https://netlinkagencies.linkpc.net/dashboard\nWithdraw: https://netlinkagencies.linkpc.net/dashboard/cashout\nReset Password: https://netlinkagencies.linkpc.net/resetpassword` };

    default:
      return { text: `I'm not sure I understood that. You can ask me things like:\n• "check my balance"\n• "my account isn't activated"\n• "how does this work"\n• "give me my referral link"\n• "how do I withdraw"` };
  }
}


// Validate the API key against Firestore 'apiKeys' collection
async function validateKey(apiKey) {
  if (!apiKey) return null;
  // Simple equality query only — avoids needing a composite index
  const snap = await db.collection('apiKeys').where('key', '==', apiKey).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  const data = doc.data();
  // Check active status in code instead of in the query
  if (data.active === false) return null;
  // Update lastUsed timestamp
  await doc.ref.update({ lastUsed: admin.firestore.FieldValue.serverTimestamp() });
  return { id: doc.id, ...data };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  let keyData;
  try {
    const apiKey = req.headers['x-api-key'];
    keyData = await validateKey(apiKey);
  } catch (e) {
    console.error('validateKey crashed:', e.message);
    return res.status(500).json({ error: 'Key validation failed: ' + e.message });
  }

  if (!keyData) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  // action determines what operation to perform
  // Pass via query param (GET) or body (POST): ?action=getUser or {action:"getUser", ...}
  const action = req.method === 'GET' ? req.query.action : (req.body && req.body.action);

  try {
    switch (action) {

      // ── GET USER INFO ──
      case 'getUser': {
        const { username, email, uid } = req.method === 'GET' ? req.query : req.body;
        let userDoc;
        if (uid) {
          userDoc = await db.collection('users').doc(uid).get();
        } else if (username) {
          const snap = await db.collection('users').where('username', '==', username).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        } else if (email) {
          const snap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        }
        if (!userDoc || !userDoc.exists) return res.status(404).json({ error: 'User not found.' });
        return res.status(200).json({ success: true, user: { id: userDoc.id, ...userDoc.data() } });
      }

      // ── LIST ALL USERS ──
      case 'listUsers': {
        const limit = parseInt(req.method === 'GET' ? req.query.limit : req.body.limit) || 50;
        const snap = await db.collection('users').limit(limit).get();
        const users = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.status(200).json({ success: true, count: users.length, users });
      }

      // ── GET PENDING WITHDRAWALS ──
      case 'getPendingWithdrawals': {
        const snap = await db.collection('pendingWithdrawals').where('status', '==', 'pending').get();
        const withdrawals = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.status(200).json({ success: true, count: withdrawals.length, withdrawals });
      }

      // ── APPROVE WITHDRAWAL ──
      case 'approveWithdrawal': {
        const { withdrawalId } = req.body;
        if (!withdrawalId) return res.status(400).json({ error: 'withdrawalId is required.' });
        await db.collection('pendingWithdrawals').doc(withdrawalId).update({ status: 'approved' });
        return res.status(200).json({ success: true, message: 'Withdrawal approved.' });
      }

      // ── GET PENDING ACTIVATIONS ──
      case 'getPendingActivations': {
        const snap = await db.collection('pendingActivations').where('status', '==', 'pending').get();
        const activations = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return res.status(200).json({ success: true, count: activations.length, activations });
      }

      // ── ACTIVATE USER ACCOUNT ──
      case 'activateUser': {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'uid is required.' });
        await db.collection('users').doc(uid).update({ activated: true, activationMethod: 'api' });
        return res.status(200).json({ success: true, message: 'User activated.' });
      }

      // ── DEACTIVATE USER ACCOUNT ──
      case 'deactivateUser': {
        const { uid, reason } = req.body;
        if (!uid) return res.status(400).json({ error: 'uid is required.' });
        await db.collection('users').doc(uid).update({
          activated: false,
          deactivatedAt: admin.firestore.FieldValue.serverTimestamp(),
          deactivationReason: reason || 'No reason provided'
        });
        return res.status(200).json({ success: true, message: 'User deactivated.' });
      }

      // ── REJECT ACTIVATION ──
      case 'rejectActivation': {
        const { activationId, reason } = req.body;
        if (!activationId) return res.status(400).json({ error: 'activationId is required.' });
        await db.collection('pendingActivations').doc(activationId).update({
          status: 'rejected',
          rejectionReason: reason || 'No reason provided'
        });
        return res.status(200).json({ success: true, message: 'Activation rejected.' });
      }

      // ── REJECT WITHDRAWAL ──
      case 'rejectWithdrawal': {
        const { withdrawalId, reason } = req.body;
        if (!withdrawalId) return res.status(400).json({ error: 'withdrawalId is required.' });
        await db.collection('pendingWithdrawals').doc(withdrawalId).update({
          status: 'rejected',
          rejectionReason: reason || 'No reason provided'
        });
        return res.status(200).json({ success: true, message: 'Withdrawal rejected.' });
      }

      // ── EDIT USER ACCOUNT (any fields) ──
      case 'editUser': {
        const { uid, updates } = req.body;
        if (!uid || !updates || typeof updates !== 'object') {
          return res.status(400).json({ error: 'uid and updates object are required.' });
        }
        // Block dangerous fields from being overwritten blindly
        const blocked = ['uid', 'createdAt'];
        blocked.forEach(f => delete updates[f]);
        await db.collection('users').doc(uid).update(updates);
        return res.status(200).json({ success: true, message: 'User updated.' });
      }

      // ── DELETE USER ──
      case 'deleteUser': {
        const { uid } = req.body;
        if (!uid) return res.status(400).json({ error: 'uid is required.' });
        await db.collection('users').doc(uid).delete();
        return res.status(200).json({ success: true, message: 'User deleted.' });
      }

      // ── UPDATE USER BALANCE ──
      case 'updateBalance': {
        const { uid, amount, field } = req.body;
        if (!uid || amount === undefined) return res.status(400).json({ error: 'uid and amount are required.' });
        const targetField = field || 'balance';
        await db.collection('users').doc(uid).update({
          [targetField]: admin.firestore.FieldValue.increment(amount)
        });
        return res.status(200).json({ success: true, message: `${targetField} updated by ${amount}.` });
      }

      // ── POST TO COMMUNITY ──
      case 'postCommunity': {
        const { title, link, platform } = req.body;
        if (!title || !link) return res.status(400).json({ error: 'title and link are required.' });
        const docRef = await db.collection('communityPosts').add({
          title, link, platform: platform || 'whatsapp',
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return res.status(200).json({ success: true, postId: docRef.id });
      }

      // ── GET ACCOUNT BALANCE ──
      case 'getBalance': {
        const { uid, username } = req.method === 'GET' ? req.query : req.body;
        let userDoc;
        if (uid) {
          userDoc = await db.collection('users').doc(uid).get();
        } else if (username) {
          const snap = await db.collection('users').where('username', '==', username).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        }
        if (!userDoc || !userDoc.exists) return res.status(404).json({ error: 'User not found.' });
        const data = userDoc.data();
        return res.status(200).json({
          success: true,
          balance: data.balance || 0,
          totalEarnings: data.totalEarnings || 0,
          withdrawn: data.withdrawn || 0,
          pending: data.pending || 0
        });
      }

      // ═══════════════════════════════════════
      // NATURAL LANGUAGE CHAT — bot sends raw user text, API figures out intent
      // Tracks conversation state per chatId so it can ask follow-up questions
      // (e.g. "my account isn't activated" -> API asks for username -> user replies
      // with just their username -> API looks them up and activates)
      // ═══════════════════════════════════════
      case 'chat': {
        const { chatId, message, platform } = req.body;
        if (!chatId || !message) {
          return res.status(400).json({ error: 'chatId and message are required.' });
        }
        const reply = await handleChat(chatId, message.trim(), platform || 'unknown');
        return res.status(200).json({ success: true, reply: reply.text, done: reply.done !== false });
      }


      // ── CHECK REGISTRATION/ACTIVATION STATUS ──
      case 'checkStatus': {
        const { username, email, phone } = req.method === 'GET' ? req.query : req.body;
        let userDoc;
        if (username) {
          const snap = await db.collection('users').where('username', '==', username).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        } else if (email) {
          const snap = await db.collection('users').where('email', '==', email).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        } else if (phone) {
          const snap = await db.collection('users').where('phone', '==', phone).limit(1).get();
          if (!snap.empty) userDoc = snap.docs[0];
        }
        if (!userDoc) {
          return res.status(200).json({
            success: true, found: false,
            message: 'No account found with those details. They may need to register first.',
            registerLink: 'https://netlinkagencies.linkpc.net/register'
          });
        }
        const d = userDoc.data();
        return res.status(200).json({
          success: true, found: true,
          username: d.username,
          activated: d.activated || false,
          balance: d.balance || 0,
          country: d.country || '',
          message: d.activated
            ? `${d.username}'s account is active and ready to use.`
            : `${d.username}'s account is registered but NOT yet activated. They need to pay the activation fee to start earning.`,
          activateLink: !d.activated ? 'https://netlinkagencies.linkpc.net/activate' : null,
          dashboardLink: d.activated ? 'https://netlinkagencies.linkpc.net/dashboard' : null
        });
      }

      // ── GET USER'S REFERRAL LINK ──
      case 'getReferralLink': {
        const { username } = req.method === 'GET' ? req.query : req.body;
        if (!username) return res.status(400).json({ error: 'username is required.' });
        const snap = await db.collection('users').where('username', '==', username).limit(1).get();
        if (snap.empty) return res.status(404).json({ error: 'User not found.' });
        const d = snap.docs[0].data();
        return res.status(200).json({
          success: true,
          referralLink: `https://netlinkagencies.linkpc.net/register?ref=${d.referralCode || d.username}`,
          level1Count: d.level1Count || 0,
          level2Count: d.level2Count || 0,
          level3Count: d.level3Count || 0
        });
      }

      // ── HOW IT WORKS / SITE GUIDE — static info for bot to relay ──
      case 'howItWorks': {
        return res.status(200).json({
          success: true,
          steps: [
            { step: 1, title: 'Register', desc: 'Create a free account with your username, email and country.', link: 'https://netlinkagencies.linkpc.net/register' },
            { step: 2, title: 'Activate', desc: 'Pay the one-time activation fee (KES 150 in Kenya) via M-Pesa STK Push or manual payment.', link: 'https://netlinkagencies.linkpc.net/activate' },
            { step: 3, title: 'Earn', desc: 'Complete tasks like surveys, quizzes, watching adverts, and inviting referrals to earn money.', link: 'https://netlinkagencies.linkpc.net/dashboard' },
            { step: 4, title: 'Withdraw', desc: 'Once you have a balance, withdraw to M-Pesa, PayPal or other supported methods.', link: 'https://netlinkagencies.linkpc.net/dashboard/cashout' }
          ],
          links: {
            register: 'https://netlinkagencies.linkpc.net/register',
            login: 'https://netlinkagencies.linkpc.net/login',
            activate: 'https://netlinkagencies.linkpc.net/activate',
            dashboard: 'https://netlinkagencies.linkpc.net/dashboard',
            resetPassword: 'https://netlinkagencies.linkpc.net/resetpassword',
            support: 'https://netlinkagencies.linkpc.net/dashboard/help'
          }
        });
      }

      // ── GET USEFUL LINKS (quick reference for bot replies) ──
      case 'getLinks': {
        return res.status(200).json({
          success: true,
          links: {
            register: 'https://netlinkagencies.linkpc.net/register',
            login: 'https://netlinkagencies.linkpc.net/login',
            activate: 'https://netlinkagencies.linkpc.net/activate',
            dashboard: 'https://netlinkagencies.linkpc.net/dashboard',
            withdraw: 'https://netlinkagencies.linkpc.net/dashboard/cashout',
            resetPassword: 'https://netlinkagencies.linkpc.net/resetpassword',
            profile: 'https://netlinkagencies.linkpc.net/dashboard/profile',
            karibuBonus: 'https://netlinkagencies.linkpc.net/dashboard/karibu',
            forexTrading: 'https://netlinkagencies.linkpc.net/dashboard/forex',
            betting: 'https://netlinkagencies.linkpc.net/dashboard/betting'
          }
        });
      }

      // ═══════════════════════════════════════
      // GET ACTIVATION INFO — the real Till number/name/amount used on the
      // activate page. The bot must call this instead of guessing payment
      // details (this is what caused it to invent a wrong Till number).
      // Pass a username to get that user's actual remaining balance if
      // someone already partly paid for them (clientPaidAmount).
      // ═══════════════════════════════════════
      case 'getActivationInfo': {
        const { username } = req.method === 'GET' ? req.query : req.body;

        let amount = 150;
        let paidByOther = 0;
        let payerUsername = null;

        if (username) {
          const snap = await db.collection('users').where('username', '==', username).limit(1).get();
          if (!snap.empty) {
            const user = snap.docs[0].data();
            paidByOther = Number(user.clientPaidAmount || 0);
            payerUsername = user.lastPayerUsername || null;
            amount = Math.max(0, 150 - paidByOther);
          }
        }

        return res.status(200).json({
          success: true,
          method: 'M-Pesa Till (Buy Goods)',
          tillNumber: '9252910',
          tillName: 'MARY KINAITORE MPURUNGA',
          baseAmount: 150,
          amountDue: amount,
          paidByOther,
          payerUsername,
          activateLink: 'https://netlinkagencies.linkpc.net/activate',
          steps: [
            'Open M-PESA on your phone',
            'Select "Send Money" (Buy Goods and Services / Till)',
            'Till Number: 9252910',
            'Name: MARY KINAITORE MPURUNGA',
            `Amount: KES ${amount}`,
            'Confirm with your M-Pesa PIN',
            'Copy the Transaction ID from the M-Pesa SMS you receive'
          ],
          note: 'The account can also pay automatically via the STK Push button on the activate page instead of these manual steps.'
        });
      }

      // ═══════════════════════════════════════
      // SEND DEACTIVATION CODE — emails an 8-digit code to the account's
      // email on file, so the bot can confirm the requester really owns
      // the account before deactivating it.
      // ═══════════════════════════════════════
      case 'sendDeactivationCode': {
        const { username } = req.method === 'GET' ? req.query : req.body;
        if (!username) return res.status(400).json({ error: 'username is required.' });

        const snap = await db.collection('users').where('username', '==', username).limit(1).get();
        if (snap.empty) return res.status(404).json({ error: `No account found with username "${username}".` });

        const userDoc = snap.docs[0];
        const user = userDoc.data();
        if (!user.email) return res.status(400).json({ error: 'This account has no email on file, so a code cannot be sent.' });

        const code = generateCode();
        const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

        await db.collection('deactivationCodes').doc(userDoc.id).set({
          code,
          expiresAt,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });

        try {
          await sendCodeEmail(user.email, user.username, code);
        } catch (e) {
          console.error('sendCodeEmail failed:', e.message);
          return res.status(500).json({ error: 'Could not send the verification email. Please try again shortly.' });
        }

        return res.status(200).json({
          success: true,
          message: 'Verification code sent to the email on file.',
          maskedEmail: maskEmail(user.email)
        });
      }

      // ═══════════════════════════════════════
      // VERIFY DEACTIVATION CODE — checks the 8-digit code the user sent back.
      // On success, the bot should then call action=deactivateUser.
      // ═══════════════════════════════════════
      case 'verifyDeactivationCode': {
        const { username, code } = req.method === 'GET' ? req.query : req.body;
        if (!username || !code) return res.status(400).json({ error: 'username and code are required.' });

        const snap = await db.collection('users').where('username', '==', username).limit(1).get();
        if (snap.empty) return res.status(404).json({ error: `No account found with username "${username}".` });

        const userDoc = snap.docs[0];
        const codeSnap = await db.collection('deactivationCodes').doc(userDoc.id).get();

        if (!codeSnap.exists) {
          return res.status(200).json({ success: true, verified: false, reason: 'No pending code for this account. Please request a new one.' });
        }

        const codeData = codeSnap.data();

        if (Date.now() > codeData.expiresAt) {
          await db.collection('deactivationCodes').doc(userDoc.id).delete();
          return res.status(200).json({ success: true, verified: false, reason: 'Code expired. Please request a new one.' });
        }

        if (String(code).trim() !== String(codeData.code)) {
          return res.status(200).json({ success: true, verified: false, reason: 'Incorrect code.' });
        }

        await db.collection('deactivationCodes').doc(userDoc.id).delete();
        return res.status(200).json({ success: true, verified: true, uid: userDoc.id, username: userDoc.data().username });
      }

      // ═══════════════════════════════════════
      // VERIFY PAYMENT — confirms an M-Pesa payment (manual Till or STK)
      // using PayHero's "Get Account Transactions" endpoint, which lists
      // ALL wallet transactions (not just ones started via our own STK push).
      // We search recent pages for a transaction whose transaction_reference
      // matches the M-Pesa code the user gave us. This works for BOTH manual
      // Till payments and STK payments, since both eventually land as a
      // wallet transaction with that M-Pesa code as the reference.
      // ═══════════════════════════════════════
      case 'verifyPayment': {
        const { txnId, reference, phone } = req.method === 'GET' ? req.query : req.body;
        const code = String(txnId || reference || '').trim();
        if (!code) return res.status(400).json({ error: 'txnId (the M-Pesa transaction code) is required.' });

        if (!process.env.PAYHERO_USERNAME || !process.env.PAYHERO_PASSWORD) {
          return res.status(500).json({ error: 'PayHero credentials are not configured on the server (missing PAYHERO_USERNAME / PAYHERO_PASSWORD).' });
        }

        try {
          const creds = Buffer.from(`${process.env.PAYHERO_USERNAME}:${process.env.PAYHERO_PASSWORD}`).toString('base64');
          const per = 100;
          const maxPages = 5; // scans the ~500 most recent wallet transactions
          let match = null;

          for (let page = 1; page <= maxPages; page++) {
            const phRes = await fetch(`https://backend.payhero.co.ke/api/v2/transactions?page=${page}&per=${per}`, {
              headers: { Authorization: `Basic ${creds}` }
            });
            if (!phRes.ok) break;

            const data = await phRes.json();
            const txns = data.transactions || [];

            match = txns.find(t => String(t.transaction_reference || '').toUpperCase() === code.toUpperCase());
            if (match) break;

            if (!data.pagination || !data.pagination.next_page) break;
          }

          if (!match) {
            return res.status(200).json({ success: true, status: 'not_found', transactionId: code });
          }

          // Optional cross-check against the phone number the user gave us
          let phoneMatches = null;
          if (phone) {
            const lastDigits = String(phone).replace(/\D/g, '').slice(-9);
            phoneMatches = !!(match.description && match.description.includes(lastDigits));
          }

          return res.status(200).json({
            success: true,
            status: match.amount > 0 ? 'successful' : 'not_found',
            transactionId: match.transaction_reference,
            amount: Math.abs(match.amount),
            description: match.description,
            date: match.created_at,
            phoneMatches // true/false/null(no phone given) — extra confirmation, not required
          });
        } catch (e) {
          console.error('PayHero verify error:', e.message);
          return res.status(500).json({ error: 'Could not reach PayHero right now. Please try again shortly.' });
        }
      }

      // ═══════════════════════════════════════
      // GET TASKS INFO — real list of earning task pages, for the bot to
      // explain accurately instead of guessing.
      // ═══════════════════════════════════════
      case 'getTasksInfo': {
        return res.status(200).json({
          success: true,
          tasks: [
            { name: 'Daily Survey', link: 'https://netlinkagencies.linkpc.net/dashboard/survey', desc: 'Answer a short daily survey to earn.' },
            { name: 'Trivia Quiz', link: 'https://netlinkagencies.linkpc.net/dashboard/trivia', desc: 'Answer trivia questions correctly to earn.' },
            { name: 'Math Quiz', link: 'https://netlinkagencies.linkpc.net/dashboard/mathquiz', desc: 'Solve simple math questions to earn.' },
            { name: 'Number Game', link: 'https://netlinkagencies.linkpc.net/dashboard/numgame', desc: 'Play the number game to earn.' },
            { name: 'View Ads', link: 'https://netlinkagencies.linkpc.net/dashboard/viewads', desc: 'View adverts to earn.' },
            { name: 'YouTube Videos', link: 'https://netlinkagencies.linkpc.net/dashboard/youtube', desc: 'Watch YouTube videos to earn.' },
            { name: 'TikTok Videos', link: 'https://netlinkagencies.linkpc.net/dashboard/tiktok', desc: 'Watch TikTok videos to earn.' },
            { name: 'Instagram Videos', link: 'https://netlinkagencies.linkpc.net/dashboard/instagram', desc: 'Watch Instagram videos to earn.' },
            { name: 'WhatsApp Adverts', link: 'https://netlinkagencies.linkpc.net/dashboard/wadvert', desc: 'Complete WhatsApp advert tasks to earn.' },
            { name: 'Company Advert', link: 'https://netlinkagencies.linkpc.net/dashboard/Company-advertisement', desc: 'Complete company advertisement tasks to earn.' },
            { name: 'Article', link: 'https://netlinkagencies.linkpc.net/dashboard/article', desc: 'Read/complete article tasks to earn.' },
            { name: 'E-Tournaments', link: 'https://netlinkagencies.linkpc.net/dashboard/tournaments', desc: 'Join e-tournaments to earn.' },
            { name: 'Betting Prediction', link: 'https://netlinkagencies.linkpc.net/dashboard/betting', desc: 'Make betting predictions to earn.' },
            { name: 'Forex Trading', link: 'https://netlinkagencies.linkpc.net/dashboard/forex', desc: 'Participate in forex trading tasks to earn.' },
            { name: 'Karibu Bonus', link: 'https://netlinkagencies.linkpc.net/dashboard/karibu', desc: 'Claim your welcome/Karibu bonus.' },
            { name: 'Mentorship', link: 'https://netlinkagencies.linkpc.net/dashboard/mentorship', desc: 'Join mentorship for extra earning opportunities.' }
          ],
          note: 'Tell the user to log in to their dashboard and open the relevant task page to complete it.'
        });
      }

      // ═══════════════════════════════════════
      // GET PAY-FOR-CLIENTS INFO
      // ═══════════════════════════════════════
      case 'getPayClientsInfo': {
        return res.status(200).json({
          success: true,
          title: 'Pay for Clients',
          link: 'https://netlinkagencies.linkpc.net/dashboard/payclients',
          desc: 'This lets an already-activated user pay another user\'s KES 150 activation fee on their behalf via Till payment, so that user gets activated (or has their remaining activation balance reduced).'
        });
      }

      // ═══════════════════════════════════════
      // SEND PASSWORD RESET — generates a REAL Firebase password reset link
      // for the account's actual email and emails it, instead of the bot
      // just pointing to the reset page with no real action behind it.
      // ═══════════════════════════════════════
      case 'sendPasswordReset': {
        const { username } = req.method === 'GET' ? req.query : req.body;
        if (!username) return res.status(400).json({ error: 'username is required.' });

        const snap = await db.collection('users').where('username', '==', username).limit(1).get();
        if (snap.empty) return res.status(404).json({ error: `No account found with username "${username}".` });

        const user = snap.docs[0].data();
        if (!user.email) return res.status(400).json({ error: 'This account has no email on file.' });

        try {
          const resetLink = await admin.auth().generatePasswordResetLink(user.email, {
            url: 'https://netlinkagencies.linkpc.net/login'
          });

          await codeMailer.sendMail({
            from: `"NETLINK AGENCIES" <${process.env.GMAIL_USER}>`,
            to: user.email,
            subject: '🔐 Reset Your NETLINK AGENCIES Password',
            html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#1a1a1a;">
              <h2 style="margin:0 0 16px;font-size:20px;font-weight:800;">Reset Your Password</h2>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;color:#333;">Hi ${user.username}, we received a request (via WhatsApp support) to reset your password. Click below — this link expires in 1 hour.</p>
              <div style="text-align:center;margin:24px 0;"><a href="${resetLink}" style="display:inline-block;background:#E91E8C;color:#fff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:800;font-size:15px;">Reset Password</a></div>
              <p style="margin:0 0 18px;font-size:14px;color:#666;">If you didn't request this, you can safely ignore this email.</p>
            </div>`
          });

          return res.status(200).json({ success: true, message: 'Password reset email sent.', maskedEmail: maskEmail(user.email) });
        } catch (e) {
          console.error('sendPasswordReset failed:', e.message);
          return res.status(500).json({ error: 'Could not send the reset email. Please try again shortly.' });
        }
      }

      default:
        return res.status(400).json({
          error: 'Unknown action.',
          availableActions: {
            adminActions: [
              'getUser', 'listUsers', 'getBalance', 'editUser', 'deleteUser',
              'getPendingWithdrawals', 'approveWithdrawal', 'rejectWithdrawal',
              'getPendingActivations', 'activateUser', 'deactivateUser', 'rejectActivation',
              'updateBalance', 'postCommunity',
              'sendDeactivationCode', 'verifyDeactivationCode', 'verifyPayment'
            ],
            userGuideActions: [
              'checkStatus', 'getReferralLink', 'howItWorks', 'getLinks',
              'getTasksInfo', 'getPayClientsInfo', 'getActivationInfo', 'sendPasswordReset'
            ]
          }
        });

    }
  } catch (err) {
    console.error('Bot API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
