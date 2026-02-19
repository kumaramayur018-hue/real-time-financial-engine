
import React, { useState, useEffect, useCallback } from 'react';
import { firebase } from './services/mockFirebase';
import { Transaction, SuspiciousAccount, RiskLevel, SystemStats } from './types';
import { StatCard } from './components/StatCard';
import { TransactionFeed } from './components/TransactionFeed';
import { NetworkGraph } from './components/NetworkGraph';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [suspicious, setSuspicious] = useState<SuspiciousAccount[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [stats, setStats] = useState<SystemStats>({
    totalTransactions: 0,
    suspiciousCount: 0,
    avgRiskScore: 0,
    systemHealth: 98.4
  });

  useEffect(() => {
    const unsubTx = firebase.subscribeTransactions((data) => {
      setTransactions(data);
    });
    const unsubSusp = firebase.subscribeSuspicious((data) => {
      setSuspicious(data);
    });

    return () => {
      unsubTx();
      unsubSusp();
    };
  }, []);

  useEffect(() => {
    const highRisk = suspicious.filter(s => s.risk_level === RiskLevel.HIGH).length;
    const avgScore = suspicious.length > 0 
      ? suspicious.reduce((acc, curr) => acc + curr.risk_score, 0) / suspicious.length 
      : 0;

    setStats({
      totalTransactions: transactions.length,
      suspiciousCount: highRisk,
      avgRiskScore: parseFloat(avgScore.toFixed(1)),
      systemHealth: parseFloat((100 - (highRisk * 0.5)).toFixed(1))
    });
  }, [transactions, suspicious]);

  // Simulation runner
  useEffect(() => {
    let interval: any;
    if (isSimulating) {
      interval = setInterval(() => {
        const pool = [
          ...Array.from({ length: 15 }, (_, i) => `ACC-${1000 + i}`),
          'ACC-HUB-1', 'ACC-HUB-2', 'ACC-MULE-X'
        ];
        const tx = {
          id: Math.random().toString(36).substr(2, 9),
          sender: pool[Math.floor(Math.random() * pool.length)],
          receiver: pool[Math.floor(Math.random() * pool.length)],
          amount: parseFloat((Math.random() * 2000 + 5).toFixed(2)),
          timestamp: Date.now()
        };
        if (tx.sender !== tx.receiver) {
          firebase.addTransaction(tx);
        }
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="h-screen w-screen bg-slate-950 text-slate-200 flex flex-col overflow-hidden">
      {/* Navbar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between px-8 backdrop-blur-md z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 20.944a11.955 11.955 0 01-8.618-3.04m14.506 0A11.955 11.955 0 0112 20.944" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">SENTINEL ENGINE</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Money Muling Detection Challenge</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
              isSimulating 
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-blue-600 text-white shadow-lg shadow-blue-900/30 hover:bg-blue-500'
            }`}
          >
            {isSimulating ? (
              <>
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                Stop Simulation
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>
                Start Simulation
              </>
            )}
          </button>
          <div className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            v1.2.0 Stable
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 p-6 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Left Column - Stats & Alerts */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 overflow-hidden">
          <div className="grid grid-cols-1 gap-4">
            <StatCard 
              label="Active Nodes" 
              value={stats.totalTransactions} 
              trend="+12%"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
            />
            <StatCard 
              label="High Risk Targets" 
              value={stats.suspiciousCount} 
              trend="+2"
              colorClass="text-red-400"
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
            <StatCard 
              label="System Health" 
              value={`${stats.systemHealth}%`} 
              icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04M12 20.944a11.955 11.955 0 01-8.618-3.04m14.506 0A11.955 11.955 0 0112 20.944" /></svg>}
            />
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-xl flex-1 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-700 bg-slate-800/80">
              <h3 className="font-bold text-slate-200">Flagged Accounts</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {suspicious.map((acc) => (
                <div key={acc.account_id} className="p-3 bg-slate-900 rounded-lg border-l-4 border-red-500 hover:bg-slate-800 transition-colors">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold mono">{acc.account_id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                      acc.risk_level === RiskLevel.HIGH ? 'bg-red-500 text-white' : 'bg-amber-500 text-black'
                    }`}>
                      {acc.risk_level}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mb-2 leading-tight">{acc.detection_reason}</p>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                      IN: {acc.in_degree}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-indigo-400"></span>
                      OUT: {acc.out_degree}
                    </div>
                  </div>
                </div>
              ))}
              {suspicious.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                  <svg className="w-10 h-10 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm">Scanning for anomalies...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Center Column - Network Graph */}
        <div className="col-span-12 lg:col-span-6 flex flex-col gap-4 overflow-hidden">
          <div className="flex-1 h-full min-h-[400px]">
            <NetworkGraph transactions={transactions} suspicious={suspicious} />
          </div>
          <div className="grid grid-cols-2 gap-4 h-32">
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Global Risk Index</span>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-4xl font-black mono text-indigo-400">{stats.avgRiskScore}</span>
                  <span className="text-xs text-slate-500 mb-2">/ 100</span>
                </div>
                <div className="w-full bg-slate-900 h-1.5 mt-2 rounded-full overflow-hidden">
                   <div className="bg-indigo-500 h-full transition-all duration-500" style={{ width: `${stats.avgRiskScore}%` }}></div>
                </div>
             </div>
             <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 flex flex-col justify-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Traffic Intensity</span>
                <div className="flex items-end gap-2 mt-1">
                  <span className="text-4xl font-black mono text-blue-400">{(transactions.length / 5).toFixed(1)}</span>
                  <span className="text-xs text-slate-500 mb-2">tx/min</span>
                </div>
                <div className="flex gap-1 mt-2">
                   {[...Array(12)].map((_, i) => (
                     <div key={i} className={`flex-1 h-1.5 rounded-full ${i < transactions.length / 10 ? 'bg-blue-500' : 'bg-slate-900'}`}></div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* Right Column - Feed */}
        <div className="col-span-12 lg:col-span-3 h-full overflow-hidden">
          <TransactionFeed transactions={transactions} />
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="h-8 border-t border-slate-800 bg-slate-900 flex items-center justify-between px-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-green-500 shadow-sm shadow-green-500/50"></span>
             Engine: Operational
          </div>
          <div className="flex items-center gap-2">
             Latency: 14ms
          </div>
          <div className="flex items-center gap-2">
             Uptime: 99.99%
          </div>
        </div>
        <div>
          © 2024 SENTINEL CRIME ENGINE • REGULATORY COMPLIANCE SYSTEM
        </div>
      </footer>
    </div>
  );
};

export default App;
