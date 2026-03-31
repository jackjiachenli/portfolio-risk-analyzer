"use client";

import { useState } from "react";
import type { AnalyseResponse } from "../lib/api";

interface Props {
  result: AnalyseResponse;
  startDate: string;
  endDate: string;
}

function pct(v: number | null, decimals = 2): string {
  return v == null ? "N/A" : `${(v * 100).toFixed(decimals)}%`;
}
function dollar(v: number): string {
  return "$" + v.toLocaleString("en", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function f(v: number | null, decimals = 2): string {
  return v == null ? "N/A" : v.toFixed(decimals);
}

export default function AdvisorPrompt({ result, startDate, endDate }: Props) {
  const [copied, setCopied] = useState(false);

  const {
    positions, total_value, risk_free_rate,
    annualised_return, annualised_volatility, sharpe_ratio,
    var: varVal, cvar, max_drawdown,
    monte_carlo, per_stock_metrics, sector_breakdown, benchmark,
  } = result;

  // Holdings table
  const holdingRows = positions.map(p => {
    const sm = per_stock_metrics?.find(s => s.ticker === p.ticker);
    return [
      p.ticker,
      p.shares.toString(),
      dollar(p.current_price),
      dollar(p.value),
      pct(p.weight),
      sm?.sector ?? "N/A",
      pct(sm?.annualised_return ?? null),
      pct(sm?.annualised_volatility ?? null),
      f(sm?.sharpe_ratio ?? null),
      pct(sm?.max_drawdown ?? null),
    ].join(" | ");
  }).join("\n");

  // Sector rows
  const sectorRows = sector_breakdown && sector_breakdown.length > 0
    ? sector_breakdown.map(s => `  ${s.sector}: ${pct(s.weight)}`).join("\n")
    : "  N/A";

  // Monte Carlo block
  let mcBlock = "N/A";
  if (monte_carlo) {
    const mc = monte_carlo;
    mcBlock = [
      `Starting value : ${dollar(mc.start_value)}`,
      `Median outcome : ${dollar(mc.median)} (${mc.median_pct > 0 ? "+" : ""}${mc.median_pct.toFixed(1)}%)`,
      `Best 5%        : ${dollar(mc.p95)} (+${mc.p95_pct.toFixed(1)}%)`,
      `Worst 5%       : ${dollar(mc.p5)} (${mc.p5_pct.toFixed(1)}%)`,
      `Prob. of profit: ${mc.prob_profit.toFixed(1)}%`,
    ].join("\n");
  }

  const prompt =
`=== PORTFOLIO ANALYSIS DATA ===

Period : ${startDate} → ${endDate}
Total value     : ${dollar(total_value)}
Risk-free rate  : ${pct(risk_free_rate)} (US 13-week Treasury)

--- HOLDINGS ---
Columns: Ticker | Shares | Price | Value | Weight | Sector | Ann.Return | Volatility | Sharpe | MaxDrawdown
${holdingRows}

--- PORTFOLIO METRICS vs SPY BENCHMARK ---
                     Portfolio        SPY
Ann. Return    :  ${pct(annualised_return).padStart(10)}   ${pct(benchmark?.annualised_return ?? null).padStart(10)}
Ann. Volatility:  ${pct(annualised_volatility).padStart(10)}   ${pct(benchmark?.annualised_volatility ?? null).padStart(10)}
Sharpe Ratio   :  ${f(sharpe_ratio).padStart(10)}   ${f(benchmark?.sharpe_ratio ?? null).padStart(10)}
Max Drawdown   :  ${pct(max_drawdown).padStart(10)}   ${pct(benchmark?.max_drawdown ?? null).padStart(10)}
VaR 95%        :  ${pct(varVal).padStart(10)}   N/A
CVaR 95%       :  ${pct(cvar).padStart(10)}   N/A

--- SECTOR BREAKDOWN ---
${sectorRows}

--- MONTE CARLO (500 paths, 1 year) ---
${mcBlock}

=== INSTRUCTIONS FOR YOUR RESPONSE ===

You have full quantitative data above. Use it all in your reasoning.

Respond with these sections:

PORTFOLIO HEALTH
2-3 sentences summarising the overall risk/return profile. Reference the Sharpe ratio and benchmark comparison specifically. Use plain language but don't shy away from financial terms — explain them briefly if used.

WHAT LOOKS STRONG
Up to 3 bullet points. Be specific — name tickers and explain why they are working, referencing their individual metrics where relevant.

WHAT TO CONSIDER REDUCING OR SELLING
Up to 3 bullet points. Name specific tickers, explain what the data shows about them, and suggest what type of position could replace them.

DIVERSIFICATION
2-3 sentences. Reference the sector breakdown specifically. Suggest concrete ETFs or asset classes that would improve the portfolio's risk profile, and explain why.

RISK SUMMARY
2-3 sentences. Translate the VaR, CVaR, max drawdown, and Monte Carlo worst case into plain English — what do these numbers actually mean for this investor in a bad year?

OVERALL VERDICT
One sentence.`;

  function copy() {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 24px" }}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em" }}>
            AI ADVISOR PROMPT
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.7rem", marginTop: "0.2rem" }}>
            Copy and paste into ChatGPT, Claude, or Gemini for personalised advice
          </p>
        </div>
        <button
          onClick={copy}
          style={{
            padding: "0.4rem 0.9rem",
            borderRadius: 6,
            background: copied ? "var(--green)" : "var(--border-hi)",
            border: "1px solid var(--border-hi)",
            color: copied ? "#000" : "var(--text)",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.7rem",
            letterSpacing: "0.08em",
            cursor: "pointer",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          {copied ? "COPIED ✓" : "COPY PROMPT"}
        </button>
      </div>
      <pre
        style={{
          background: "var(--bg)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "1rem",
          fontSize: "0.72rem",
          lineHeight: 1.7,
          color: "var(--muted)",
          overflowX: "auto",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          maxHeight: 400,
          overflowY: "auto",
        }}
      >
        {prompt}
      </pre>
    </div>
  );
}
