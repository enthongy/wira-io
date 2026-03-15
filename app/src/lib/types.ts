export interface Transaction {
  transaction_id: number;
  amount: number;
  transaction_hour: number;
  merchant_category: string;
  foreign_transaction: boolean;
  location_mismatch: boolean;
  device_trust_score: number;
  cardholder_age: number;
  velocity_last_24h: number;
  is_fraud: boolean;
  risk_score: number;
}

export interface FraudTrend {
  hour: string;
  total: number;
  fraudulent: number;
  rate: number;
}

export interface CategoryBreakdown {
  category: string;
  total: number;
  fraudulent: number;
  rate: number;
}

export interface DashboardStats {
  totalTransactions: number;
  totalFraud: number;
  fraudRate: number;
  avgAmount: number;
  highRiskCount: number;
  totalVolume: number;
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
