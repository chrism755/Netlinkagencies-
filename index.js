const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { sendEmail } = require("./emailService");

admin.initializeApp();

const db = admin.firestore();

// When user gets activated, send welcome email and pay L1/L2/L3
exports.onUserActivated = functions.firestore
  .document('users/{userId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only run if status changed from pending to active
    if (before.status === 'active' || after.status !== 'active') return null;

    const userId = context.params.userId;
    const referredBy = after.referredBy;

    try {
      // Send account activation email
      await sendEmail('accountActivated', {
        username: after.username || after.fullName || 'User',
        email: after.email,
      });

      if (!referredBy) return null;

      // Bonus amounts
      const L1_BONUS = 500;
      const L2_BONUS = 200;
      const L3_BONUS = 100;

      // Find L1 inviter by referralCode
      const l1Snap = await db.collection('users').where('referralCode', '==', referredBy).limit(1).get();
      if (l1Snap.empty) return null;

      const l1Doc = l1Snap.docs[0];
      const l1Id = l1Doc.id;
      const l1Data = l1Doc.data();

      // Pay L1
      await db.collection('users').doc(l1Id).update({
        balance: admin.firestore.FieldValue.increment(L1_BONUS),
        totalEarnings: admin.firestore.FieldValue.increment(L1_BONUS),
        referralEarnings: admin.firestore.FieldValue.increment(L1_BONUS),
        l1Referrals: admin.firestore.FieldValue.increment(1)
      });

      // Send L1 referral email
      await sendEmail('newReferral', {
        username: l1Data.username || l1Data.fullName || 'User',
        email: l1Data.email,
      }, {
        referralName: after.username || after.fullName || 'A new user',
        bonus: L1_BONUS,
      });

      // Pay L2 if exists
      if (l1Data.referredBy) {
        const l2Snap = await db.collection('users').where('referralCode', '==', l1Data.referredBy).limit(1).get();
        if (!l2Snap.empty) {
          const l2Id = l2Snap.docs[0].id;
          const l2Data = l2Snap.docs[0].data();

          await db.collection('users').doc(l2Id).update({
            balance: admin.firestore.FieldValue.increment(L2_BONUS),
            totalEarnings: admin.firestore.FieldValue.increment(L2_BONUS),
            referralEarnings: admin.firestore.FieldValue.increment(L2_BONUS),
            l2Referrals: admin.firestore.FieldValue.increment(1)
          });

          // Send L2 bonus email
          await sendEmail('levelBonus', {
            username: l2Data.username || l2Data.fullName || 'User',
            email: l2Data.email,
          }, {
            level: 2,
            amount: L2_BONUS,
          });

          // Pay L3 if exists
          if (l2Data.referredBy) {
            const l3Snap = await db.collection('users').where('referralCode', '==', l2Data.referredBy).limit(1).get();
            if (!l3Snap.empty) {
              const l3Id = l3Snap.docs[0].id;
              const l3Data = l3Snap.docs[0].data();

              await db.collection('users').doc(l3Id).update({
                balance: admin.firestore.FieldValue.increment(L3_BONUS),
                totalEarnings: admin.firestore.FieldValue.increment(L3_BONUS),
                referralEarnings: admin.firestore.FieldValue.increment(L3_BONUS),
                l3Referrals: admin.firestore.FieldValue.increment(1)
              });

              // Send L3 bonus email
              await sendEmail('levelBonus', {
                username: l3Data.username || l3Data.fullName || 'User',
                email: l3Data.email,
              }, {
                level: 3,
                amount: L3_BONUS,
              });
            }
          }
        }
      }

      console.log(`✅ Referral paid and emails sent for ${userId}`);
      return null;
    } catch (e) {
      console.error("❌ Error in onUserActivated:", e);
      return null;
    }
  });

// When task is completed and user earns money
exports.onTaskCompleted = functions.firestore
  .document('tasks/{taskId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only run if status changed to completed
    if (before.status === 'completed' || after.status !== 'completed') return null;

    const userId = after.userId;
    const taskName = after.taskName || 'Task';
    const earnedAmount = after.reward || 0;

    try {
      // Get user details
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();

      // Update user earnings
      await db.collection('users').doc(userId).update({
        balance: admin.firestore.FieldValue.increment(earnedAmount),
        totalEarnings: admin.firestore.FieldValue.increment(earnedAmount),
        completedTasks: admin.firestore.FieldValue.increment(1),
      });

      // Send task earnings email
      await sendEmail('taskEarnings', {
        username: userData.username || userData.fullName || 'User',
        email: userData.email,
      }, {
        amount: earnedAmount,
        taskName: taskName,
      });

      console.log(`✅ Task completed and email sent for user ${userId}`);
      return null;
    } catch (e) {
      console.error("❌ Error in onTaskCompleted:", e);
      return null;
    }
  });

// When withdrawal is processed
exports.onWithdrawalProcessed = functions.firestore
  .document('withdrawals/{withdrawalId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Only run if status changed to completed/processed
    if (before.status === 'processed' || after.status !== 'processed') return null;

    const userId = after.userId;
    const withdrawalAmount = after.amount || 0;
    const withdrawalMethod = after.method || 'Bank Transfer';

    try {
      // Get user details
      const userDoc = await db.collection('users').doc(userId).get();
      if (!userDoc.exists) return null;

      const userData = userDoc.data();

      // Send withdrawal processed email
      await sendEmail('withdrawalProcessed', {
        username: userData.username || userData.fullName || 'User',
        email: userData.email,
      }, {
        amount: withdrawalAmount,
        method: withdrawalMethod,
      });

      console.log(`✅ Withdrawal processed and email sent for user ${userId}`);
      return null;
    } catch (e) {
      console.error("❌ Error in onWithdrawalProcessed:", e);
      return null;
    }
  });
