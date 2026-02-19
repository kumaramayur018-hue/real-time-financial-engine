
export enum RiskLevel {
  LOW = 'Low',
  MEDIUM = 'Medium',
  HIGH = 'High'
}

export interface Transaction {
  id: string;
  sender: string;
  receiver: string;
  amount: number;
  timestamp: number;
}

export interface SuspiciousAccount {
  account_id: string;
  in_degree: number;
  out_degree: number;
  transaction_velocity: number;
  risk_score: number;
  risk_level: RiskLevel;
  detection_reason: string;
  last_updated: number;
}

export interface GraphNode {
  id: string;
  group: number;
  risk_level: RiskLevel;
}

export interface GraphLink {
  source: string;
  target: string;
  value: number;
}

export interface SystemStats {
  totalTransactions: number;
  suspiciousCount: number;
  avgRiskScore: number;
  systemHealth: number;
}
