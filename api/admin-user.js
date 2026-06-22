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
const auth = admin.auth();

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Secret');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Lightweight shared-secret check. NOTE: this is the same security
  // level as the rest of the admin panel (a hardcoded client-side check) —
  // it stops casual/accidental access but is not a real auth system.
  const secret = req.headers['x-admin-secret'];
  if (!process.env.ADMIN_API_SECRET || secret !== process.env.ADMIN_API_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, uid, email, password } = req.body || {};
  if (!uid) return res.status(400).json({ error: 'Missing uid' });

  try {
    if (action === 'updateAuth') {
      const updates = {};
      if (email) updates.email = String(email).toLowerCase().trim();
      if (password) {
        if (password.length < 6) {
          return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }
        updates.password = password;
      }
      if (Object.keys(updates).length === 0) {
        return res.status(200).json({ success: true, skipped: true });
      }
      await auth.updateUser(uid, updates);
      return res.status(200).json({ success: true });
    }

    if (action === 'deleteAccount') {
      // Delete the Firestore profile first.
      await db.collection('users').doc(uid).delete();
      // Then remove the Firebase Auth account so the email becomes reusable.
      try {
        await auth.deleteUser(uid);
      } catch (authErr) {
        // If the Auth user is already gone, that's fine — Firestore doc is gone too.
        console.log('Auth delete warning:', authErr.message);
      }
      return res.status(200).json({ success: true });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error('admin-user error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
