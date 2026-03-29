"use client";

import { useState } from "react";
import type { AnalyseResponse } from "../lib/api";
import type { PortfolioEntry } from "../app/page";

interface Props {
  result: AnalyseResponse;
  entries: PortfolioEntry[];
  startDate: string;
  endDate: string;
}

function pct(v: number | null) { return v == null ? "N/A" : `${(v * 100).toFixed(2)}%`; }
function f(v: number | null)   { return v == null ? "N/A" : v.toFixed(2); }

export default function AdvisorPrompt({ result, entries, startDate, endDate }: Props) {
  const [copied, setCopied] = useState(false);

  const { positions, total_value, risk_free_rate, annualised_return, annualised_volatility,
          sharpe_ratio, var: varVal, cvar, max_drawdown, correlation, monte_carlo } = result;

  const holdingsTable = positions.map(p =>
    `  ${p.ticker.padEnd(8)} ${p.shares.toFixed(4).padStart(10)} $${p.current_price.toFixed(2).padStart(9)}  $${p.value.toLocaleString("en", { maximumFractionDigits: 2 }).padStart(12)}  ${(p.weight * 100).toFixed(1).padStart(6)}%`
  ).join("\n");

  let corrBlock = "";
  if (correlation) {
    const header = "          " + correlation.tickers.map(t => t.padStart(8)).join("");
    const rows   = correlation.tickers.map((t, i) =>
      t.padStart(8) + "  " + correlation.values[i].map(v => v.toFixed(2).padStart(8)).join("")
    ).join("\n");
    corrBlock = `── CORRELATION MATRIX ──────────────────────────────────────────────
(1.0 = perfectly correlated · 0 = independent · -1 = inverse)

${header}
${rows}
`;
  }

  let mcBlock = "";
  if (monte_carlo) {
    const mc = monte_carlo;
    mcBlock = `── MONTE CARLO SIMULATION (1 YEAR · 500 PATHS) ─────────────────────
Starting Value    : $${mc.start_value.toLocaleString("en", { maximumFractionDigits: 2 })}
Median Outcome    : $${mc.median.toLocaleString("en", { maximumFractionDigits: 2 })}  (${mc.median_pct > 0 ? "+" : ""}${mc.median_pct.toFixed(1)}%)
Best 5% Scenario  : $${mc.p95.toLocaleString("en", { maximumFractionDigits: 2 })}  (${mc.p95_pct > 0 ? "+" : ""}${mc.p95_pct.toFixed(1)}%)
Worst 5% Scenario : $${mc.p5.toLocaleString("en", { maximumFractionDigits: 2 })}  (${mc.p5_pct > 0 ? "+" : ""}${mc.p5_pct.toFixed(1)}%)
Prob. of Profit   : ${mc.prob_profit.toFixed(1)}%
`;
  }

  const prompt = `${"=".repeat(70)}
PORTFOLIO RISK ANALYSIS — AI ADVISOR PROMPT
${"=".repeat(70)}

You are an expert quantitative portfolio analyst and financial advisor.
Below is a complete risk analysis of my current stock portfolio.
Please provide specific, actionable advice based on this data.

── PORTFOLIO HOLDINGS ──────────────────────────────────────────────
Analysis Period : ${startDate} to ${endDate}
Total Value     : $${total_value.toLocaleString("en", { maximumFractionDigits: 2 })}
Risk-Free Rate  : ${pct(risk_free_rate)} (US 10yr Treasury)

  ${"Ticker".padEnd(8)} ${"Shares".padStart(10)} ${"Price".padStart(10)}  ${"Value".padStart(13)}  ${"Weight".padStart(7)}
  ${"-".repeat(58)}
${holdingsTable}

── RISK METRICS ────────────────────────────────────────────────────
Annualised Return      : ${pct(annualised_return)}
Annualised Volatility  : ${pct(annualised_volatility)}
Sharpe Ratio           : ${f(sharpe_ratio)}  (>1 = good · >2 = excellent)
Value at Risk (95%)    : ${pct(varVal)}  (daily loss not exceeded 95% of days)
CVaR (95%)             : ${pct(cvar)}  (avg loss on worst 5% of days)
Max Drawdown           : ${pct(max_drawdown)}  (worst peak-to-trough decline)

${corrBlock}
${mcBlock}
── QUESTIONS FOR YOU TO ANSWER ─────────────────────────────────────

Based on ALL of the above data, please answer the following:

1. PORTFOLIO HEALTH
   How healthy is this portfolio overall? Is the risk/return tradeoff
   appropriate? How does the Sharpe Ratio compare to a simple S&P 500
   index fund benchmark?

2. WHAT TO KEEP
   Which positions are contributing positively to risk-adjusted returns?
   Which holdings should I hold long-term and why?

3. WHAT TO REDUCE OR SELL
   Which positions are hurting my Sharpe Ratio or adding unnecessary
   concentration risk? Be specific about which tickers and why.

4. DIVERSIFICATION GAPS
   Looking at the correlation matrix, am I truly diversified or are my
   holdings moving together? What asset classes or sectors am I missing?

5. RISK ASSESSMENT
   Given my VaR, CVaR and Max Drawdown — am I taking on too much risk?
   What is my biggest risk exposure right now?

6. MONTE CARLO OUTLOOK
   Based on the simulation, what does my 1-year outlook look like?
   Should I be concerned about the worst-case scenarios?

7. SPECIFIC ACTIONS
   Give me 3-5 concrete actions I should take with this portfolio,
   ranked by priority. Be specific — name tickers, suggest alternatives
   if applicable, and explain the reasoning.

${"=".repeat(70)}
Please be direct, specific, and reference the actual numbers above.
Do not give generic advice — treat this as a real portfolio review.
${"=".repeat(70)}`;

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