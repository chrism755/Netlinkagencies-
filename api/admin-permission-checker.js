// ============================================================
// PASTE THIS CODE at the top of every admin page's <script>
// Replace 'manageUsers' with the correct permission key for that page:
//
// manageUsers       → users.html
// approveActivation → activation.html
// approveWithdraw   → withdraw.html
// accessSettings    → settings.html
// postCommunity     → community.html
// viewPayments      → deposits.html / panel.html
// ============================================================

import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

async function checkPermission(permissionKey) {
  const adminData = JSON.parse(localStorage.getItem('nlAdmin') || '{}');
  // Master admin always has full access
  if (adminData.role === 'master') return true;
  // Co-admin — check permission from Firestore
  const db = getFirestore();
  const q = query(collection(db, 'coAdmins'), where('email', '==', adminData.email));
  const snap = await getDocs(q);
  if (snap.empty) return false;
  const perms = snap.docs[0].data().permissions || {};
  return perms[permissionKey] === true;
}

async function guardPage(permissionKey) {
  const allowed = await checkPermission(permissionKey);
  if (!allowed) {
    document.body.innerHTML = `
      <div style="min-height:100vh;background:#050D1A;display:flex;align-items:center;justify-content:center;font-family:Nunito,sans-serif;padding:20px;">
        <div style="background:#111E35;border:1px solid #1E3560;border-radius:20px;padding:40px 30px;text-align:center;max-width:400px;width:100%;">
          <div style="font-size:60px;margin-bottom:16px;">🔒</div>
          <h2 style="color:#FF3B3B;font-size:20px;font-weight:900;margin-bottom:10px;">Access Restricted</h2>
          <p style="color:#8BA4CC;font-size:14px;line-height:1.7;margin-bottom:24px;">
            You are restricted to use this action.<br>Contact the master admin to get permission.
          </p>
          <button onclick="window.location.href='/admin/panel.html'" 
            style="background:linear-gradient(135deg,#0057FF,#00D4FF);color:#fff;border:none;border-radius:10px;padding:13px 30px;font-size:14px;font-weight:800;cursor:pointer;font-family:Nunito,sans-serif;width:100%;">
            ← Go Back to Panel
          </button>
        </div>
      </div>`;
  }
}

// Call this at the start of each admin page — replace key with correct one
guardPage('manageUsers'); // ← change this key per page
