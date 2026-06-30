import admin from 'firebase-admin';

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

// Validate the API key against Firestore 'apiKeys' collection
async function validateKey(apiKey) {
  if (!apiKey) return null;
  const snap = await db.collection('apiKeys').where('key', '==', apiKey).where('active', '!=', false).limit(1).get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  // Update lastUsed timestamp
  await doc.ref.update({ lastUsed: admin.firestore.FieldValue.serverTimestamp() });
  return { id: doc.id, ...doc.data() };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const apiKey = req.headers['x-api-key'];
  const keyData = await validateKey(apiKey);

  if (!keyData) {
    return res.status(401).json({ error: 'Invalid or revoked API key.' });
  }

  // action determines what operation to perform
  // Pass via query param (GET) or body (POST): ?action=getUser or {action:"getUser", ...}
  const action = req.method === 'GET' ? req.query.action : req.body.action;

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

      default:
        return res.status(400).json({
          error: 'Unknown action.',
          availableActions: [
            'getUser', 'listUsers', 'getBalance',
            'getPendingWithdrawals', 'approveWithdrawal',
            'getPendingActivations', 'activateUser',
            'updateBalance', 'postCommunity'
          ]
        });
    }
  } catch (err) {
    console.error('Bot API error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
