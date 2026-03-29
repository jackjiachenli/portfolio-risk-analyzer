"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  annReturn: number | null;
  annVol: number | null;
  totalValue: number;
  startDate: string;
  endDate: string;
}

export default function CumulativeChart({ annReturn, annVol, totalValue, startDate, endDate }: Props) {
  if (annReturn == null || annVol == null) return null;

  // Reconstruct approximate cumulative return path from annualised stats
  const start = new Date(startDate);
  const end   = new Date(endDate);
  const days  = Math.floor((end.getTime() - start.getTime()) / 86400000);
  const dailyReturn = annReturn / 252;
  const dates: string[] = [];
  const values: number[] = [];
  let val = totalValue;

  for (let i = 0; i <= days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    dates.push(d.toISOString().slice(0, 10));
    val *= (1 + dailyReturn);
    values.push(val);
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        ESTIMATED CUMULATIVE RETURN PATH
      </p>
      <Plot
        data={[{
          type: "scatter",
          mode: "lines",
          x: dates,
          y: values,
          line: { color: "#ededed", width: 2 },
          fill: "tozeroy",
          fillcolor: "rgba(237,237,237,0.05)",
          hovertemplate: "%{x}: $%{y:,.0f}<extra></extra>",
        }]}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 70, r: 30, t: 20, b: 50 },
          height: 280,
          xaxis: { gridcolor: "#1a1a1a", zeroline: false, color: "#888888" },
          yaxis: { gridcolor: "#1a1a1a", zeroline: false, tickprefix: "$", color: "#888888" },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}