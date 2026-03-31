"use client";

import dynamic from "next/dynamic";
import type { SectorBreakdown } from "../lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props { sectors: SectorBreakdown[]; }

const BAR_COLOR = "#4ade80";

export default function SectorChart({ sectors }: Props) {
  // Sort ascending so longest bar is at top in horizontal chart
  const sorted = [...sectors].sort((a, b) => a.weight - b.weight);

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        SECTOR BREAKDOWN
      </p>
      <Plot
        data={[{
          type: "bar",
          orientation: "h",
          x: sorted.map(s => +(s.weight * 100).toFixed(2)),
          y: sorted.map(s => s.sector),
          marker: { color: BAR_COLOR },
          text: sorted.map(s => `${(s.weight * 100).toFixed(1)}%`),
          textposition: "outside",
          textfont: { family: "monospace", size: 11, color: "#888888" },
          hovertemplate: "<b>%{y}</b><br>%{x:.1f}%<extra></extra>",
          cliponaxis: false,
        }]}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 160, r: 60, t: 10, b: 36 },
          height: Math.max(180, sorted.length * 40 + 60),
          xaxis: {
            ticksuffix: "%",
            gridcolor: "#1a1a1a",
            zeroline: false,
            showline: false,
          },
          yaxis: {
            gridcolor: "#1a1a1a",
            tickfont: { family: "monospace", size: 11, color: "#888888" },
          },
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}
