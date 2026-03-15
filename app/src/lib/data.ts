import { Transaction, FraudTrend, CategoryBreakdown, DashboardStats, RiskLevel } from './types';

// Compute a risk score from transaction features (0–100)
export function computeRiskScore(row: Omit<Transaction, 'risk_score'>): number {
  let score = 0;

  // High amounts are riskier
  if (row.amount > 500) score += 25;
  else if (row.amount > 200) score += 15;
  else if (row.amount > 100) score += 8;

  // Late-night / early-morning hours
  if (row.transaction_hour >= 0 && row.transaction_hour <= 5) score += 15;
  else if (row.transaction_hour >= 22) score += 10;

  // Foreign transaction and location mismatch
  if (row.foreign_transaction) score += 20;
  if (row.location_mismatch) score += 20;

  // Low device trust score
  if (row.device_trust_score < 30) score += 20;
  else if (row.device_trust_score < 50) score += 12;
  else if (row.device_trust_score < 70) score += 5;

  // High velocity
  if (row.velocity_last_24h >= 6) score += 15;
  else if (row.velocity_last_24h >= 4) score += 8;
  else if (row.velocity_last_24h >= 3) score += 4;

  return Math.min(100, score);
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'critical';
  if (score >= 50) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case 'critical': return '#DC2626';
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#10B981';
  }
}

export function getRiskBgClass(level: RiskLevel): string {
  switch (level) {
    case 'critical': return 'bg-red-600/20 text-red-400 border-red-500/30';
    case 'high': return 'bg-red-500/15 text-red-400 border-red-500/20';
    case 'medium': return 'bg-amber-500/15 text-amber-400 border-amber-500/20';
    case 'low': return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20';
  }
}

// Parse CSV text into Transaction[]
export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  return lines.slice(1).map((line) => {
    const values = line.split(',');
    const row = {
      transaction_id: parseInt(values[0]),
      amount: parseFloat(values[1]),
      transaction_hour: parseInt(values[2]),
      merchant_category: values[3],
      foreign_transaction: values[4] === '1',
      location_mismatch: values[5] === '1',
      device_trust_score: parseInt(values[6]),
      velocity_last_24h: parseInt(values[7]),
      cardholder_age: parseInt(values[8]),
      is_fraud: values[9]?.trim() === '1',
      risk_score: 0,
    };
    row.risk_score = computeRiskScore(row);
    return row;
  });
}

export function computeStats(transactions: Transaction[]): DashboardStats {
  const totalTransactions = transactions.length;
  const totalFraud = transactions.filter(t => t.is_fraud).length;
  const fraudRate = totalTransactions > 0 ? (totalFraud / totalTransactions) * 100 : 0;
  const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);
  const avgAmount = totalTransactions > 0 ? totalVolume / totalTransactions : 0;
  const highRiskCount = transactions.filter(t => t.risk_score >= 50).length;

  return { totalTransactions, totalFraud, fraudRate, avgAmount, highRiskCount, totalVolume };
}

export function computeFraudTrends(transactions: Transaction[]): FraudTrend[] {
  const hourMap = new Map<number, { total: number; fraudulent: number }>();

  for (let h = 0; h < 24; h++) {
    hourMap.set(h, { total: 0, fraudulent: 0 });
  }

  transactions.forEach(t => {
    const entry = hourMap.get(t.transaction_hour)!;
    entry.total++;
    if (t.is_fraud) entry.fraudulent++;
  });

  return Array.from(hourMap.entries()).map(([hour, data]) => ({
    hour: `${hour.toString().padStart(2, '0')}:00`,
    total: data.total,
    fraudulent: data.fraudulent,
    rate: data.total > 0 ? parseFloat(((data.fraudulent / data.total) * 100).toFixed(1)) : 0,
  }));
}

export function computeCategoryBreakdown(transactions: Transaction[]): CategoryBreakdown[] {
  const catMap = new Map<string, { total: number; fraudulent: number }>();

  transactions.forEach(t => {
    if (!catMap.has(t.merchant_category)) {
      catMap.set(t.merchant_category, { total: 0, fraudulent: 0 });
    }
    const entry = catMap.get(t.merchant_category)!;
    entry.total++;
    if (t.is_fraud) entry.fraudulent++;
  });

  return Array.from(catMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      fraudulent: data.fraudulent,
      rate: data.total > 0 ? parseFloat(((data.fraudulent / data.total) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.rate - a.rate);
}
