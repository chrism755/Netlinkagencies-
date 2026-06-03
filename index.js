const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// When user gets activated, pay L1/L2/L3
exports.onUserActivated = functions.firestore
.document('users/{userId}')
.onUpdate(async (change, context) => {
  const before = change.before.data();
  const after = change.after.data();

  // Only run if status changed from pending to active
  if(before.status === 'active' || after.status!== 'active') return null;

  const userId = context.params.userId;
  const referredBy = after.referredBy; // This must exist like "INV123"

  if(!referredBy) return null;

  // Bonus amounts - change these
  const L1_BONUS = 500;
  const L2_BONUS = 200;
  const L3_BONUS = 100;

  try {
    // Find L1 inviter by referralCode
    const l1Snap = await db.collection('users').where('referralCode', '==', referredBy).limit(1).get();
    if(l1Snap.empty) return null;

    const l1Doc = l1Snap.docs[0];
    const l1Id = l1Doc.id;
    const l1Data = l1Doc.data();

    // Pay L1
    await db.collection('users').doc(l1Id).update({
      balance: admin.firestore.FieldValue.increment(L1_BONUS),
      totalEarnings: admin.firestore.FieldValue.increment(L1_BONUS), // ← KEY FIX
      referralEarnings: admin.firestore.FieldValue.increment(L1_BONUS),
      l1Referrals: admin.firestore.FieldValue.increment(1)
    });

    // Pay L2 if exists
    if(l1Data.referredBy){
      const l2Snap = await db.collection('users').where('referralCode', '==', l1Data.referredBy).limit(1).get();
      if(!l2Snap.empty){
        const l2Id = l2Snap.docs[0].id;
        await db.collection('users').doc(l2Id).update({
          balance: admin.firestore.FieldValue.increment(L2_BONUS),
          totalEarnings: admin.firestore.FieldValue.increment(L2_BONUS), // ← KEY FIX
          referralEarnings: admin.firestore.FieldValue.increment(L2_BONUS),
          l2Referrals: admin.firestore.FieldValue.increment(1)
        });

        // Pay L3 if exists
        const l2Data = l2Snap.docs[0].data();
        if(l2Data.referredBy){
          const l3Snap = await db.collection('users').where('referralCode', '==', l2Data.referredBy).limit(1).get();
          if(!l3Snap.empty){
            const l3Id = l3Snap.docs[0].id;
            await db.collection('users').doc(l3Id).update({
              balance: admin.firestore.FieldValue.increment(L3_BONUS),
              totalEarnings: admin.firestore.FieldValue.increment(L3_BONUS), // ← KEY FIX
              referralEarnings: admin.firestore.FieldValue.increment(L3_BONUS),
              l3Referrals: admin.firestore.FieldValue.increment(1)
            });
          }
        }
      }
    }

    console.log(`Referral paid for ${userId}`);
    return null;
  } catch(e){
    console.error(e);
    return null;
  }
});
