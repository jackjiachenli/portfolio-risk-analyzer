"use client";

import dynamic from "next/dynamic";
import type { Data } from "plotly.js";
import type { CorrelationMatrix } from "../lib/api";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props { correlation: CorrelationMatrix; }

export default function CorrelationChart({ correlation }: Props) {
  const rounded = correlation.values.map(row => row.map(v => Math.round(v * 100) / 100));
  const textLabels = rounded.map(row => row.map(v => v.toFixed(2))) as unknown as string[];
  const trace: Data = {
    type: "heatmap",
    x: correlation.tickers,
    y: correlation.tickers,
    z: rounded,
    colorscale: [[0, "#0a0a0a"], [0.5, "#2a2a2a"], [1, "#ededed"]] as [number, string][],
    zmin: -1, zmax: 1,
    text: textLabels as unknown as string[],    
    texttemplate: "%{text}",
    showscale: true,
    hovertemplate: "%{y} × %{x}: %{z:.2f}<extra></extra>",
  };

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        CORRELATION MATRIX
      </p>
      <Plot
        data={[trace]}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 60, r: 30, t: 20, b: 60 },
          height: 300,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}