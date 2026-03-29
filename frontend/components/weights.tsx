"use client";

import dynamic from "next/dynamic";
import type { PositionDetail } from "../lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props { positions: PositionDetail[]; }

const COLORS = ["#ffffff", "#4ade80", "#fbbf24", "#f87171", "#60a5fa", "#e879f9", "#fb923c", "#a3e635"];

export default function WeightsChart({ positions }: Props) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        PORTFOLIO WEIGHTS
      </p>
      <Plot
        data={[{
          type: "pie",
          labels: positions.map(p => p.ticker),
          values: positions.map(p => p.value),
          hole: 0.55,
          marker: {
            colors: COLORS,
            line: { color: "#0a0a0a", width: 2 },
          },
          textinfo: "label+percent",
          textfont: { family: "monospace", size: 12, color: "#000000" },
          hovertemplate: "<b>%{label}</b><br>$%{value:,.2f}<br>%{percent}<extra></extra>",
        }]}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 20, r: 20, t: 20, b: 20 },
          height: 300,
          showlegend: true,
          legend: { font: { family: "monospace", size: 10, color: "#888888" }, bgcolor: "transparent" },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}