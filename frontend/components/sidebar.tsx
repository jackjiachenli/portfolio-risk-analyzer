"use client";

import { useState } from "react";
import type { PortfolioEntry } from "../app/page";

interface Props {
  entries: PortfolioEntry[];
  startDate: string;
  endDate: string;
  loading: boolean;
  isMobile: boolean;
  onAdd: (ticker: string, shares: number) => Promise<void>;
  onRemove: (ticker: string) => void;
  onStartDate: (d: string) => void;
  onEndDate: (d: string) => void;
  onAnalyse: () => void;
  onClose: () => void;
}

export default function Sidebar({
  entries, startDate, endDate, loading, isMobile,
  onAdd, onRemove, onStartDate, onEndDate, onAnalyse, onClose,
}: Props) {
  const [ticker, setTicker]   = useState("");
  const [shares, setShares]   = useState("");
  const [adding, setAdding]   = useState(false);
  const [addError, setAddError] = useState("");

  const totalValue = entries.reduce((s, e) => s + e.shares * e.price, 0);

  async function handleAdd() {
    if (!ticker || !shares) return;
    setAdding(true);
    setAddError("");
    try {
      await onAdd(ticker.toUpperCase().trim(), parseFloat(shares));
      setTicker("");
      setShares("");
    } catch {
      setAddError(`Could not fetch price for ${ticker.toUpperCase()}`);
    } finally {
      setAdding(false);
    }
  }

  const inputStyle = {
    background: "var(--bg)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    color: "var(--text)",
    fontFamily: "DM Mono, monospace",
    fontSize: "0.8rem",
    padding: "0.5rem 0.7rem",
    outline: "none",
    width: "100%",
    transition: "border-color 0.2s",
  };

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 20px 16px 20px",
        borderBottom: "1px solid var(--border)",
      }}>
        <span style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.14em" }}>
          PORTFOLIO RISK ANALYZER
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "1rem", lineHeight: 1 }}
          >
            ✕
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: 24 }}>

        {/* Add position */}
        <div>
          <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>
            ADD POSITION
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              style={inputStyle}
              placeholder="Ticker (e.g. VOO)"
              value={ticker}
              onChange={e => setTicker(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            <input
              style={inputStyle}
              placeholder="Shares (e.g. 2.1324)"
              type="number"
              step="0.0001"
              min="0.0001"
              value={shares}
              onChange={e => setShares(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
            />
            {addError && (
              <p style={{ color: "var(--red)", fontSize: "0.7rem" }}>{addError}</p>
            )}
            <button
              onClick={handleAdd}
              disabled={adding || !ticker || !shares}
              style={{
                width: "100%",
                padding: "0.5rem",
                borderRadius: 6,
                background: "transparent",
                border: "1px solid var(--border-hi)",
                color: adding ? "var(--muted)" : "var(--text)",
                fontFamily: "DM Mono, monospace",
                fontSize: "0.75rem",
                letterSpacing: "0.08em",
                cursor: adding ? "not-allowed" : "pointer",
                transition: "all 0.2s",
              }}
            >
              {adding ? "FETCHING..." : "+ ADD POSITION"}
            </button>
          </div>
        </div>

        {/* Holdings */}
        {entries.length > 0 && (
          <div>
            <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>
              HOLDINGS
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {entries.map(e => {
                const val = e.shares * e.price;
                const w = totalValue > 0 ? (val / totalValue * 100).toFixed(1) : "0.0";
                return (
                  <div
                    key={e.ticker}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 8, padding: "10px 12px", borderRadius: 8,
                      background: "var(--bg)", border: "1px solid var(--border)",
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{
                          fontFamily: "DM Mono, monospace", fontSize: "0.75rem",
                          padding: "2px 6px", borderRadius: 4,
                          background: "var(--surface)", color: "var(--text)",
                          border: "1px solid var(--border-hi)",
                        }}>
                          {e.ticker}
                        </span>
                        <span style={{ color: "var(--muted)", fontSize: "0.65rem" }}>{w}%</span>
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: "0.65rem", marginTop: 4 }}>
                        {e.shares.toFixed(4)} × ${e.price.toFixed(2)} = <span style={{ color: "var(--text)" }}>${val.toLocaleString("en", { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => onRemove(e.ticker)}
                      style={{ color: "var(--muted)", background: "none", border: "none", cursor: "pointer", fontSize: "0.75rem", padding: "2px 4px", flexShrink: 0 }}
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              <div style={{ color: "var(--muted)", fontSize: "0.65rem", textAlign: "right", paddingTop: "0.2rem" }}>
                TOTAL ${totalValue.toLocaleString("en", { maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        )}

        {/* Date range */}
        <div>
          <p style={{ color: "var(--muted)", fontSize: "0.65rem", letterSpacing: "0.12em", marginBottom: "0.6rem" }}>
            DATE RANGE
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.6rem", marginBottom: "0.3rem" }}>FROM</p>
              <input type="date" style={inputStyle} value={startDate} onChange={e => onStartDate(e.target.value)} />
            </div>
            <div>
              <p style={{ color: "var(--muted)", fontSize: "0.6rem", marginBottom: "0.3rem" }}>TO</p>
              <input type="date" style={inputStyle} value={endDate} onChange={e => onEndDate(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid var(--border)" }}>
        <button
          onClick={onAnalyse}
          disabled={loading || entries.length === 0}
          style={{
            width: "100%", padding: "0.75rem", borderRadius: 8,
            background: loading || entries.length === 0 ? "var(--border)" : "var(--text)",
            border: "none",
            color: loading || entries.length === 0 ? "var(--muted)" : "var(--bg)",
            fontFamily: "DM Mono, monospace",
            fontSize: "0.8rem", letterSpacing: "0.1em",
            cursor: loading || entries.length === 0 ? "not-allowed" : "pointer",
            transition: "all 0.2s",
          }}
        >
          {loading ? "ANALYSING..." : "ANALYSE PORTFOLIO →"}
        </button>
      </div>
    </div>
  );
}