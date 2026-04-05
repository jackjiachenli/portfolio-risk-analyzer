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
    sharpe_ratio: sr, sortino_ratio: sortino, treynor_ratio: treynor, calmar_ratio: calmar,
    beta, alpha,
    var: v, cvar: cv, max_drawdown: md,
    risk_free_rate: rf, total_value: tv,
  } = result;

  const returnColor  = ar == null      ? "var(--text)" : ar > 0       ? "var(--green)"  : "var(--red)";
  const sharpeColor  = sr == null      ? "var(--text)" : sr > 1       ? "var(--green)"  : sr > 0       ? "var(--yellow)" : "var(--red)";
  const sortinoColor = sortino == null  ? "var(--text)" : sortino > 1  ? "var(--green)"  : sortino > 0  ? "var(--yellow)" : "var(--red)";
  const treynorColor = treynor == null  ? "var(--text)" : treynor > 0.1 ? "var(--green)" : treynor > 0  ? "var(--yellow)" : "var(--red)";
  const calmarColor  = calmar == null   ? "var(--text)" : calmar > 1   ? "var(--green)"  : calmar > 0   ? "var(--yellow)" : "var(--red)";
  const volColor     = av == null      ? "var(--text)" : av > 0.25    ? "var(--red)"    : av > 0.15    ? "var(--yellow)" : "var(--text)";
  const ddColor      = md == null      ? "var(--text)" : md < -0.2    ? "var(--red)"    : "var(--yellow)";
  const betaColor    = beta == null    ? "var(--text)" : beta > 1.2   ? "var(--red)"    : beta < 0.8   ? "var(--green)"  : "var(--text)";
  const alphaColor   = alpha == null   ? "var(--text)" : alpha > 0    ? "var(--green)"  : "var(--red)";

  return (
    <div>
      <p style={{ color: "var(--muted)", fontSize: "0.72rem", letterSpacing: "0.12em", marginBottom: 16 }}>
        RISK METRICS — PORTFOLIO VALUE ${tv.toLocaleString("en", { maximumFractionDigits: 2 })} · RISK-FREE RATE {pct(rf)}
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card label="Annual Return"         value={pct(ar)}      color={returnColor}
              benchmarkValue={benchmark ? pct(benchmark.annualised_return) : undefined} />
        <Card label="Annualised Volatility" value={pct(av)}      color={volColor}
              benchmarkValue={benchmark ? pct(benchmark.annualised_volatility) : undefined} />
        <Card label="Sharpe Ratio"          value={f(sr)}        color={sharpeColor}
              sub={sr != null ? (sr > 1 ? "Good risk-adjusted return" : sr > 0 ? "Below benchmark" : "Negative") : undefined}
              benchmarkValue={benchmark ? f(benchmark.sharpe_ratio) : undefined} />
        <Card label="Sortino Ratio"         value={f(sortino)}   color={sortinoColor}
              sub={sortino != null ? (sortino > 1 ? "Good downside-adjusted return" : sortino > 0 ? "Below benchmark" : "Negative") : undefined}
              benchmarkValue={benchmark ? f(benchmark.sortino_ratio) : undefined} />
        <Card label="Treynor Ratio"         value={f(treynor)}   color={treynorColor}
              sub={treynor != null ? (treynor > 0.1 ? "Good market-risk-adjusted return" : treynor > 0 ? "Modest return per unit of beta" : "Negative") : undefined}
              benchmarkValue={benchmark ? f(benchmark.treynor_ratio) : undefined} />
        <Card label="Calmar Ratio"          value={f(calmar)}    color={calmarColor}
              sub={calmar != null ? (calmar > 1 ? "Return well above max drawdown" : calmar > 0 ? "Return below max drawdown" : "Negative") : undefined}
              benchmarkValue={benchmark ? f(benchmark.calmar_ratio) : undefined} />
        <Card label="Beta"                  value={f(beta, 3)}   color={betaColor}
              sub={beta != null ? (beta > 1 ? "More volatile than market" : beta < 1 ? "Less volatile than market" : "Moves with market") : undefined} />
        <Card label="Alpha"                 value={pct(alpha)}   color={alphaColor}
              sub={alpha != null ? (alpha > 0 ? "Outperforming risk-adjusted benchmark" : "Underperforming risk-adjusted benchmark") : undefined} />
        <Card label="VaR — 95%"             value={pct(v)}       color="var(--yellow)"
              sub="Daily loss not exceeded 95% of days" />
        <Card label="CVaR — 95%"            value={pct(cv)}      color="var(--red)"
              sub="Avg loss on worst 5% of days" />
        <Card label="Max Drawdown"          value={pct(md)}      color={ddColor}
              sub="Worst peak-to-trough decline"
              benchmarkValue={benchmark ? pct(benchmark.max_drawdown) : undefined} />
      </div>
    </div>
  );
}