"use client";

import dynamic from "next/dynamic";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false });

interface Props {
  dates: string[] | null;
  values: number[] | null;
}

export default function CumulativeChart({ dates, values }: Props) {
  if (!dates || !values) return null;

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.75rem" }}>
        HISTORICAL CUMULATIVE RETURN
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
          hovertemplate: "%{x}: %{y:.3f}<extra></extra>",
        }]}
        layout={{
          paper_bgcolor: "#0a0a0a",
          plot_bgcolor:  "#0a0a0a",
          font: { family: "monospace", color: "#888888", size: 11 },
          margin: { l: 70, r: 30, t: 20, b: 50 },
          height: 280,
          xaxis: { gridcolor: "#1a1a1a", zeroline: false, color: "#888888" },
          yaxis: { gridcolor: "#1a1a1a", zeroline: false, color: "#888888", tickformat: ".2f" },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: "100%" }}
      />
    </div>
  );
}