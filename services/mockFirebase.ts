
import { Transaction, SuspiciousAccount, RiskLevel } from '../types';

type Listener<T> = (data: T[]) => void;

class MockFirebase {
  private transactions: Transaction[] = [];
  private suspiciousAccounts: Map<string, SuspiciousAccount> = new Map();
  private txListeners: Listener<Transaction>[] = [];
  private suspListeners: Listener<SuspiciousAccount>[] = [];

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // Generate some initial baseline accounts
    const baseAccounts = Array.from({ length: 20 }, (_, i) => `ACC-${1000 + i}`);
    for (let i = 0; i < 50; i++) {
      const tx = this.generateRandomTx(baseAccounts);
      this.transactions.push(tx);
    }
    this.recalculateAllRisk();
  }

  private generateRandomTx(accounts: string[]): Transaction {
    const sender = accounts[Math.floor(Math.random() * accounts.length)];
    let receiver = accounts[Math.floor(Math.random() * accounts.length)];
    while (receiver === sender) {
      receiver = accounts[Math.floor(Math.random() * accounts.length)];
    }
    return {
      id: Math.random().toString(36).substr(2, 9),
      sender,
      receiver,
      amount: parseFloat((Math.random() * 5000 + 10).toFixed(2)),
      timestamp: Date.now() - Math.floor(Math.random() * 1000000),
    };
  }

  // Simulate Cloud Function logic for risk detection
  private analyzeAccount(accountId: string) {
    const received = this.transactions.filter(t => t.receiver === accountId);
    const sent = this.transactions.filter(t => t.sender === accountId);
    
    const in_degree = received.length;
    const out_degree = sent.length;
    
    // Simple logic: Money muling often involves receiving from many and sending quickly to one or many
    const uniqueSenders = new Set(received.map(t => t.sender)).size;
    const uniqueReceivers = new Set(sent.map(t => t.receiver)).size;
    
    // Velocity calculation (time difference between first in and first out in recent window)
    let velocity = 0;
    if (received.length > 0 && sent.length > 0) {
      const firstIn = Math.min(...received.map(t => t.timestamp));
      const firstOut = Math.max(...sent.map(t => t.timestamp));
      velocity = Math.abs(firstOut - firstIn) / 3600000; // in hours
    }

    // Scoring logic
    let score = 0;
    let reason = "Normal Activity";

    if (uniqueSenders >= 3 && out_degree >= 1) {
      score += 40;
      reason = "High Fan-in: Receiving from multiple sources";
    }
    if (in_degree > 0 && out_degree > 0 && velocity < 2) {
      score += 30;
      reason = "High Velocity: Funds moved within 2 hours";
    }
    if (in_degree > 5 && out_degree > 5) {
      score += 20;
      reason = "Hub Behavior: High central connectivity";
    }

    let level = RiskLevel.LOW;
    if (score >= 70) level = RiskLevel.HIGH;
    else if (score >= 40) level = RiskLevel.MEDIUM;

    if (score > 10) {
      this.suspiciousAccounts.set(accountId, {
        account_id: accountId,
        in_degree,
        out_degree,
        transaction_velocity: velocity,
        risk_score: score,
        risk_level: level,
        detection_reason: reason,
        last_updated: Date.now()
      });
    } else {
      this.suspiciousAccounts.delete(accountId);
    }
  }

  private recalculateAllRisk() {
    const allIds = new Set([
      ...this.transactions.map(t => t.sender),
      ...this.transactions.map(t => t.receiver)
    ]);
    allIds.forEach(id => this.analyzeAccount(id));
  }

  public addTransaction(tx: Transaction) {
    this.transactions.unshift(tx);
    if (this.transactions.length > 500) this.transactions.pop();
    
    this.analyzeAccount(tx.sender);
    this.analyzeAccount(tx.receiver);
    
    this.notify();
  }

  public subscribeTransactions(cb: Listener<Transaction>) {
    this.txListeners.push(cb);
    cb([...this.transactions]);
    return () => { this.txListeners = this.txListeners.filter(l => l !== cb); };
  }

  public subscribeSuspicious(cb: Listener<SuspiciousAccount>) {
    this.suspListeners.push(cb);
    cb(Array.from(this.suspiciousAccounts.values()));
    return () => { this.suspListeners = this.suspListeners.filter(l => l !== cb); };
  }

  private notify() {
    const txs = [...this.transactions];
    const susps = Array.from(this.suspiciousAccounts.values());
    this.txListeners.forEach(l => l(txs));
    this.suspListeners.forEach(l => l(susps));
  }
}

export const firebase = new MockFirebase();
