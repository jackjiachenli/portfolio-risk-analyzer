"use client";

import dynamic from "next/dynamic";
import type { Data } from "plotly.js";
import type { MonteCarloSummary } from "../lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props { summary: MonteCarloSummary; }

function fmt(v: number) { return `$${v.toLocaleString("en", { maximumFractionDigits: 0 })}`; }
function fmtPct(v: number) { return `${v > 0 ? "+" : ""}${v.toFixed(1)}%`; }

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{ background: "#000000", border: "1px solid var(--border)", borderRadius: 10, padding: "14px 16px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.6rem", letterSpacing: "0.12em", marginBottom: 6 }}>{label}</p>
      <p style={{ color, fontSize: "1.3rem", fontFamily: "monospace", fontWeight: 600 }}>{value}</p>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", marginTop: 4 }}>{sub}</p>
    </div>
  );
}

export default function MonteCarloChart({ summary }: Props) {
  const { start_value, median, median_pct, p5, p5_pct, p95, p95_pct, prob_profit, paths, median_path, p5_path, p95_path } = summary;
  if (!median_path || !p5_path || !p95_path || !paths) return null;
  const days = Array.from({ length: median_path.length }, (_, i) => i);


  const traces: Data[] = [
    // Dimmed background paths
    ...paths.map(path => ({
      x: days,
      y: path,
      mode: "lines" as const,
      line: { color: "rgba(255,255,255,0.04)", width: 1 },
      showlegend: false,
      hoverinfo: "skip" as const,
    })),
    // 95th percentile
    {
      x: days, y: p95_path, mode: "lines" as const,
      name: "95th percentile",
      line: { color: "#4ade80", width: 1.5, dash: "dot" as const },
      hovertemplate: "Day %{x}<br>Best 5%: $%{y:,.0f}<extra></extra>",
    },
    // Median
    {
      x: days, y: median_path, mode: "lines" as const,
      name: "Median",
      line: { color: "#ededed", width: 2.5 },
      hovertemplate: "Day %{x}<br>Median: $%{y:,.0f}<extra></extra>",
    },
    // 5th percentile
    {
      x: days, y: p5_path, mode: "lines" as const,
      name: "5th percentile",
      line: { color: "#f87171", width: 1.5, dash: "dot" as const },
      hovertemplate: "Day %{x}<br>Worst 5%: $%{y:,.0f}<extra></extra>",
    },
  ];

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: 16 }}>
        MONTE CARLO SIMULATION — {median_path.length} DAYS FORWARD · {paths.length * 5} PATHS
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20 }}>
        <StatCard label="MEDIAN OUTCOME"    value={fmt(median)} sub={fmtPct(median_pct)} color="var(--text)" />
        <StatCard label="BEST 5% SCENARIO"  value={fmt(p95)}    sub={fmtPct(p95_pct)}    color="#4ade80" />
        <StatCard label="WORST 5% SCENARIO" value={fmt(p5)}     sub={fmtPct(p5_pct)}     color="#f87171" />
        <StatCard label="PROB. OF PROFIT"   value={`${prob_profit.toFixed(1)}%`} sub="paths above start" color={prob_profit > 50 ? "#4ade80" : "#f87171"} />
      </div>

      <Plot
        data={traces}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 70, r: 30, t: 20, b: 50 },
          height: 380,
          xaxis: { title: { text: "Trading Days" }, gridcolor: "#1a1a1a", zeroline: false, color: "#888888" },
          yaxis: { title: { text: "Portfolio Value" }, gridcolor: "#1a1a1a", zeroline: false, tickprefix: "$", color: "#888888" },
          legend: { font: { family: "monospace", size: 10, color: "#888888" }, bgcolor: "transparent" },
          showlegend: true,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}