const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// Types

export interface Position {
  ticker: string;
  shares: number;
}

export interface PositionDetail {
  ticker: string;
  shares: number;
  current_price: number;
  value: number;
  weight: number;
}

export interface MonteCarloSummary {
  start_value: number;
  median: number;
  median_pct: number;
  p5: number;
  p5_pct: number;
  p95: number;
  p95_pct: number;
  prob_profit: number;
  paths: number[][];
  median_path: number[];
  p5_path: number[];
  p95_path: number[];
}

export interface CorrelationMatrix {
  tickers: string[];
  values: number[][];
}

export interface BenchmarkData {
  annualised_return: number | null;
  annualised_volatility: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
}

export interface PerStockMetrics {
  ticker: string;
  annualised_return: number | null;
  annualised_volatility: number | null;
  sharpe_ratio: number | null;
  max_drawdown: number | null;
  sector: string | null;
}

export interface SectorBreakdown {
  sector: string;
  value: number;
  weight: number;
}

export interface AnalyseResponse {
  positions: PositionDetail[];
  total_value: number;
  risk_free_rate: number;
  annualised_return: number | null;
  annualised_volatility: number | null;
  sharpe_ratio: number | null;
  var: number | null;
  cvar: number | null;
  max_drawdown: number | null;
  correlation: CorrelationMatrix | null;
  monte_carlo: MonteCarloSummary | null;
  benchmark: BenchmarkData | null;
  per_stock_metrics: PerStockMetrics[] | null;
  sector_breakdown: SectorBreakdown[] | null;
  cumulative_returns: number[] | null;
  cumulative_dates: string[] | null;
}

export interface AnalyseRequest {
  positions: Position[];
  start_date: string;
  end_date: string;
  confidence_level?: number;
  simulations?: number;
  simulation_days?: number;
}

// API calls

export async function fetchPrice(ticker: string): Promise<number> {
  const res = await fetch(`${API_BASE}/price/${ticker}`);
  if (!res.ok) throw new Error(`Could not fetch price for ${ticker}`);
  const data = await res.json();
  return data.price as number;
}

export async function analysePortfolio(
  request: AnalyseRequest
): Promise<AnalyseResponse> {
  const res = await fetch(`${API_BASE}/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail ?? "Analysis failed");
  }
  return res.json() as Promise<AnalyseResponse>;
}