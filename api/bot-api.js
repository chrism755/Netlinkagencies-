/**
 * NETLINK AGENCIES — Bot API Handler
 * File: /api/bot-api.js
 *
 * Usage: Any request must include header:
 *   X-NETLINK-KEY: your-api-key
 *
 * Body: { action: "actionName", ...params }
 *
 * Supported actions:
 *   getStats, getUsers, getPendingWithdrawals, approveWithdrawal,
 *   rejectWithdrawal, getPendingDeposits, approveDeposit,
 *   getPendingActivations, approveActivation, rejectActivation,
 *   getUser, banUser, unbanUser
 */

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, getDocs, doc, getDoc,
  updateDoc, query, where, orderBy, serverTimestamp, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyCCFExYKkXxauIXVv2HzNHbNnizL6MF_p4",
  authDomain: "netlink-agencies-6399e.firebaseapp.com",
  projectId: "netlink-agencies-6399e",
  storageBucket: "netlink-agencies-6399e.firebasestorage.app",
  messagingSenderId: "546397751362",
  appId: "1:546397751362:web:c74e057b2b0ceb6c0745db"
};

const app = getApps().length ? getApps()[0] : initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// ─── Validate API Key ──────────────────────────────────────
async function validateKey(apiKey) {
  if (!apiKey) return null;
  const snap = await getDocs(query(collection(db, 'apiKeys'), where('key', '==', apiKey), where('status', '==', 'active')));
  if (snap.empty) return null;
  const keyDoc = snap.docs[0];
  const data = keyDoc.data();

  // Check expiry
  if (data.expiry !== 'never' && data.expiryDate) {
    const expDate = new Date(data.expiryDate);
    if (new Date() > expDate) {
      await updateDoc(doc(db, 'apiKeys', keyDoc.id), { status: 'expired' });
      return null;
    }
  }

  // Track usage
  await updateDoc(doc(db, 'apiKeys', keyDoc.id), {
    usageCount: increment(1),
    lastUsed: serverTimestamp()
  });

  return data;
}

// ─── Action Handlers ──────────────────────────────────────
const actions = {

  async getStats() {
    const users = await getDocs(collection(db, 'users'));
    const all = users.docs.map(d => d.data());
    const pendingW = await getDocs(query(collection(db, 'pendingWithdrawals'), where('status', '==', 'pending')));
    const pendingD = await getDocs(query(collection(db, 'pendingDeposits'), where('status', '==', 'pending')));
    const pendingA = await getDocs(query(collection(db, 'pendingActivations'), where('status', '==', 'pending')));
    const approvedW = await getDocs(query(collection(db, 'pendingWithdrawals'), where('status', '==', 'approved')));
    let totalPaid = 0;
    approvedW.docs.forEach(d => totalPaid += d.data().amount || 0);
    return {
      totalUsers: all.length,
      activeUsers: all.filter(u => u.activated).length,
      pendingWithdrawals: pendingW.size,
      pendingDeposits: pendingD.size,
      pendingActivations: pendingA.size,
      totalPaidOut: totalPaid
    };
  },

  async getUsers() {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map(d => ({ uid: d.id, ...d.data(), password: undefined }));
  },

  async getUser({ uid }) {
    if (!uid) throw new Error('uid required');
    const snap = await getDoc(doc(db, 'users', uid));
    if (!snap.exists()) throw new Error('User not found');
    return { uid: snap.id, ...snap.data(), password: undefined };
  },

  async getPendingWithdrawals() {
    const snap = await getDocs(query(collection(db, 'pendingWithdrawals'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async approveWithdrawal({ id }) {
    if (!id) throw new Error('id required');
    await updateDoc(doc(db, 'pendingWithdrawals', id), { status: 'approved', approvedAt: serverTimestamp() });
    return { success: true, message: 'Withdrawal approved' };
  },

  async rejectWithdrawal({ id, reason }) {
    if (!id) throw new Error('id required');
    await updateDoc(doc(db, 'pendingWithdrawals', id), { status: 'rejected', rejectedAt: serverTimestamp(), reason: reason || 'Rejected by admin' });
    return { success: true, message: 'Withdrawal rejected' };
  },

  async getPendingDeposits() {
    const snap = await getDocs(query(collection(db, 'pendingDeposits'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async approveDeposit({ id }) {
    if (!id) throw new Error('id required');
    await updateDoc(doc(db, 'pendingDeposits', id), { status: 'approved', approvedAt: serverTimestamp() });
    return { success: true, message: 'Deposit approved' };
  },

  async getPendingActivations() {
    const snap = await getDocs(query(collection(db, 'pendingActivations'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async approveActivation({ id, uid }) {
    if (!id || !uid) throw new Error('id and uid required');
    await updateDoc(doc(db, 'pendingActivations', id), { status: 'approved', approvedAt: serverTimestamp() });
    await updateDoc(doc(db, 'users', uid), { activated: true });
    return { success: true, message: 'Activation approved' };
  },

  async rejectActivation({ id }) {
    if (!id) throw new Error('id required');
    await updateDoc(doc(db, 'pendingActivations', id), { status: 'rejected', rejectedAt: serverTimestamp() });
    return { success: true, message: 'Activation rejected' };
  },

  async banUser({ uid }) {
    if (!uid) throw new Error('uid required');
    await updateDoc(doc(db, 'users', uid), { banned: true });
    return { success: true, message: 'User banned' };
  },

  async unbanUser({ uid }) {
    if (!uid) throw new Error('uid required');
    await updateDoc(doc(db, 'users', uid), { banned: false });
    return { success: true, message: 'User unbanned' };
  }
};

// ─── Main Handler (call this from your bot) ────────────────
export async function handleBotRequest(apiKey, action, params = {}) {
  try {
    const keyData = await validateKey(apiKey);
    if (!keyData) {
      return { error: 'Invalid or expired API key', status: 401 };
    }

    if (!actions[action]) {
      return { error: `Unknown action: ${action}. Valid: ${Object.keys(actions).join(', ')}`, status: 400 };
    }

    const result = await actions[action](params);
    return { data: result, status: 200 };

  } catch (e) {
    return { error: e.message, status: 500 };
  }
}

/*
 ═══════════════════════════════════════════════
  TELEGRAM BOT EXAMPLE (Node.js)
 ═══════════════════════════════════════════════

  const API_KEY = 'NL-your-key-here';
  const BASE = 'https://netlinkagencies.linkpc.net';

  // Get stats
  const res = await fetch(`${BASE}/api/bot-api.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NETLINK-KEY': API_KEY },
    body: JSON.stringify({ action: 'getStats' })
  });
  const { data } = await res.json();
  bot.sendMessage(chatId, `📊 Stats:\nUsers: ${data.totalUsers}\nPending withdrawals: ${data.pendingWithdrawals}`);

  // Approve a withdrawal
  await fetch(`${BASE}/api/bot-api.js`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-NETLINK-KEY': API_KEY },
    body: JSON.stringify({ action: 'approveWithdrawal', id: 'withdrawal-doc-id' })
  });
*/
