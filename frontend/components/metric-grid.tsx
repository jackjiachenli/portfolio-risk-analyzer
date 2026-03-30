import type { AnalyseResponse, BenchmarkData } from "../lib/api";

interface Props { result: AnalyseResponse; benchmark: BenchmarkData | null; }

function pct(v: number | null) {
  return v == null ? "N/A" : `${(v * 100).toFixed(2)}%`;
}
function f(v: number | null, d = 2) {
  return v == null ? "N/A" : v.toFixed(d);
}

interface CardProps {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  benchmarkValue?: string;
}

function Card({ label, value, sub, color = "var(--text)", benchmarkValue }: CardProps) {
  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      padding: "20px 24px",
      minWidth: 0,
      overflow: "hidden",
    }}>
      <p style={{
        color: "var(--muted)", fontSize: "0.7rem",
        letterSpacing: "0.14em", textTransform: "uppercase",
        marginBottom: 8,
      }}>
        {label}
      </p>
      <p className="font-display" style={{
        color, fontSize: "2rem", letterSpacing: "0.04em",
        lineHeight: 1.1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {value}
      </p>
      {sub && (
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: 6 }}>{sub}</p>
      )}
      {benchmarkValue && (
        <p style={{ color: "var(--muted)", fontSize: "0.72rem", marginTop: 4 }}>SPY {benchmarkValue}</p>
      )}
    </div>
  );
}

export default function MetricGrid({ result, benchmark }: Props) {
  const {
    annualised_return: ar, annualised_volatility: av,
    sharpe_ratio: sr, var: v, cvar: cv, max_drawdown: md,
    risk_free_rate: rf, total_value: tv,
  } = result;

  const returnColor = ar == null ? "var(--text)" : ar > 0 ? "var(--green)" : "var(--red)";
  const sharpeColor = sr == null ? "var(--text)" : sr > 1 ? "var(--green)" : sr > 0 ? "var(--yellow)" : "var(--red)";
  const volColor    = av == null ? "var(--text)" : av > 0.25 ? "var(--red)" : av > 0.15 ? "var(--yellow)" : "var(--text)";
  const ddColor     = md == null ? "var(--text)" : md < -0.2 ? "var(--red)" : "var(--yellow)";

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: 16 }}>
        RISK METRICS — PORTFOLIO VALUE ${tv.toLocaleString("en", { maximumFractionDigits: 2 })} · RISK-FREE RATE {pct(rf)}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card label="Annual Return"         value={pct(ar)}  color={returnColor}
              benchmarkValue={benchmark ? pct(benchmark.annualised_return) : undefined} />
        <Card label="Annualised Volatility" value={pct(av)}  color={volColor}
              benchmarkValue={benchmark ? pct(benchmark.annualised_volatility) : undefined} />
        <Card label="Sharpe Ratio"          value={f(sr)}    color={sharpeColor}
              sub={sr != null ? (sr > 1 ? "Good risk-adjusted return" : sr > 0 ? "Below benchmark" : "Negative") : undefined}
              benchmarkValue={benchmark ? f(benchmark.sharpe_ratio) : undefined} />
        <Card label="VaR — 95%"             value={pct(v)}   color="var(--yellow)"
              sub="Daily loss not exceeded 95% of days" />
        <Card label="CVaR — 95%"            value={pct(cv)}  color="var(--red)"
              sub="Avg loss on worst 5% of days" />
        <Card label="Max Drawdown"          value={pct(md)}  color={ddColor}
              sub="Worst peak-to-trough decline"
              benchmarkValue={benchmark ? pct(benchmark.max_drawdown) : undefined} />
      </div>
    </div>
  );
}