
import React from 'react';
import { Transaction } from '../types';

interface TransactionFeedProps {
  transactions: Transaction[];
}

export const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactions }) => (
  <div className="bg-slate-800/50 border border-slate-700 rounded-xl flex flex-col h-full overflow-hidden">
    <div className="p-4 border-b border-slate-700 bg-slate-800/80 flex justify-between items-center">
      <h3 className="font-bold text-slate-200">Live Ledger</h3>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
        <span className="text-xs text-slate-400 uppercase tracking-widest font-bold">Real-time</span>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto p-2 space-y-2">
      {transactions.slice(0, 50).map((tx) => (
        <div key={tx.id} className="p-3 bg-slate-900/40 rounded-lg border border-slate-700/50 hover:bg-slate-800 transition-colors group">
          <div className="flex justify-between items-start mb-1">
            <span className="text-[10px] mono text-slate-500 group-hover:text-slate-400">TXID: {tx.id}</span>
            <span className="text-sm font-bold text-blue-400 mono">${tx.amount.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase">From</span>
              <span className="text-xs text-slate-300 truncate w-20 mono">{tx.sender}</span>
            </div>
            <div className="text-slate-600">→</div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500 uppercase">To</span>
              <span className="text-xs text-slate-300 truncate w-20 mono">{tx.receiver}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);
