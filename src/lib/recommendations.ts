// Pure helpers for matching instruments to user preferences.
export type RiskAppetite = "low" | "medium" | "high";
export type InvestmentGoal = "growth" | "income" | "preservation" | "speculation";
export type InvestmentType = "short-term" | "medium-term" | "long-term";
export type Liquidity = "low" | "medium" | "high";

export interface Preferences {
  risk_appetite: RiskAppetite;
  investment_goal: InvestmentGoal;
  investment_type: InvestmentType;
  investment_amount: number;
  liquidity: Liquidity;
  sectors: string[];
}

export interface InstrumentLite {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  expected_return: number;
  risk_level: "Low" | "Medium" | "High";
  sector: string;
  dividend_yield: number;
  volatility: number;
  market_cap: number;
  ticker: string | null;
}

const riskScore = { Low: 1, Medium: 2, High: 3 } as const;
const apptScore: Record<RiskAppetite, number> = { low: 1, medium: 2, high: 3 };

// Score 0..100 for how well an instrument fits given preferences.
export function suitabilityScore(i: InstrumentLite, p: Preferences): number {
  let score = 50;

  // Risk match
  const diff = Math.abs(riskScore[i.risk_level] - apptScore[p.risk_appetite]);
  score += diff === 0 ? 25 : diff === 1 ? 5 : -25;

  // Goal alignment
  if (p.investment_goal === "income" && i.dividend_yield >= 4) score += 15;
  if (p.investment_goal === "growth" && i.expected_return >= 10) score += 15;
  if (p.investment_goal === "preservation" && i.volatility <= 0.15) score += 20;
  if (p.investment_goal === "speculation" && i.volatility >= 0.3) score += 15;

  // Liquidity proxy: higher market cap & ETFs/cash = more liquid
  if (p.liquidity === "high" && (i.category === "ETFs" || i.sector === "Cash")) score += 8;
  if (p.liquidity === "low" && i.category === "Unit Trusts") score += 4;

  // Horizon proxy
  if (p.investment_type === "long-term" && i.expected_return >= 8) score += 6;
  if (p.investment_type === "short-term" && i.volatility <= 0.1) score += 8;

  // Sector preference
  if (p.sectors.length && p.sectors.includes(i.sector)) score += 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function rankInstruments(items: InstrumentLite[], p: Preferences) {
  return items
    .map((i) => ({ ...i, _score: suitabilityScore(i, p) }))
    .sort((a, b) => b._score - a._score);
}

export const SECTORS = [
  "Technology",
  "Healthcare",
  "Energy",
  "Real Estate",
  "Government",
  "Diversified",
  "Cash",
] as const;
