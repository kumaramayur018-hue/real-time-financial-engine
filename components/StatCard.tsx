
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  colorClass?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, trend, icon, colorClass = "text-blue-400" }) => (
  <div className="bg-slate-800/50 border border-slate-700 p-6 rounded-xl shadow-lg hover:border-slate-500 transition-colors">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-2 rounded-lg bg-slate-900 ${colorClass}`}>
        {icon}
      </div>
      {trend && (
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend.startsWith('+') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
          {trend}
        </span>
      )}
    </div>
    <div className="text-sm text-slate-400 font-medium uppercase tracking-wider">{label}</div>
    <div className="text-3xl font-bold mt-1 text-slate-100 mono">{value}</div>
  </div>
);
