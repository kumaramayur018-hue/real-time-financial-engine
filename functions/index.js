
/**
 * CLOUD FUNCTION FOR REAL-TIME GRAPH-BASED DETECTION
 * This logic should be deployed to Firebase Functions.
 */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const db = admin.firestore();

exports.onTransactionCreated = functions.firestore
  .document('transactions/{transactionId}')
  .onCreate(async (snapshot, context) => {
    const tx = snapshot.data();
    const { sender, receiver, timestamp } = tx;

    // Detect logic for both sender and receiver
    const affectedAccounts = [sender, receiver];

    for (const accountId of affectedAccounts) {
      // 1. Fetch recent window of transactions for this node (Graph Edge Extraction)
      const windowSize = 24 * 60 * 60 * 1000; // 24 hours
      const recentTxsQuery = await db.collection('transactions')
        .where('timestamp', '>=', timestamp - windowSize)
        .where('sender', '==', accountId)
        .get();
        
      const recentIncomingQuery = await db.collection('transactions')
        .where('timestamp', '>=', timestamp - windowSize)
        .where('receiver', '==', accountId)
        .get();

      const sentTxs = recentTxsQuery.docs.map(d => d.data());
      const receivedTxs = recentIncomingQuery.docs.map(d => d.data());

      // 2. Compute Graph Metrics
      const inDegree = receivedTxs.length;
      const outDegree = sentTxs.length;
      const uniqueSenders = new Set(receivedTxs.map(t => t.sender)).size;
      const uniqueReceivers = new Set(sentTxs.map(t => t.receiver)).size;

      // Money Muling Logic (Layering Phase Detection)
      let score = 0;
      let reason = "Normal";

      // Pattern: High Fan-In followed by Outbound
      if (uniqueSenders >= 5 && outDegree >= 1) {
        score += 60;
        reason = "Potential Collection Hub (Many-to-One)";
      }

      // Pattern: High Velocity (Integration Phase)
      if (inDegree > 0 && outDegree > 0) {
        const firstIn = Math.min(...receivedTxs.map(t => t.timestamp));
        const lastOut = Math.max(...sentTxs.map(t => t.timestamp));
        const durationHours = (lastOut - firstIn) / 3600000;
        if (durationHours < 1) {
            score += 30;
            reason = "Hyper-velocity Fund Movement";
        }
      }

      // 3. Update Suspicious Collection
      const riskLevel = score >= 70 ? 'High' : (score >= 40 ? 'Medium' : 'Low');
      
      if (score >= 40) {
        await db.collection('suspicious_accounts').doc(accountId).set({
          account_id: accountId,
          in_degree: inDegree,
          out_degree: outDegree,
          risk_score: score,
          risk_level: riskLevel,
          detection_reason: reason,
          last_updated: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      } else {
        // Clear if no longer risky
        await db.collection('suspicious_accounts').doc(accountId).delete();
      }
    }
    
    return null;
  });
