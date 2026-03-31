"use client";

import { useState, useCallback, useEffect } from "react";
import { fetchPrice, analysePortfolio } from "../lib/api";
import type { AnalyseResponse, Position } from "../lib/api";
import Sidebar from "../components/sidebar";
import MetricGrid from "../components/metric-grid";
import CorrelationChart from "../components/correlation";
import WeightsChart from "../components/weights";
import MonteCarloChart from "../components/monte-carlo";
import CumulativeChart from "../components/cumulative";
import AdvisorPrompt from "../components/advisor";
import SectorChart from "../components/sectors";

export interface PortfolioEntry {
  ticker: string;
  shares: number;
  price: number;
}

export default function Home() {
  const [entries, setEntries] = useState<PortfolioEntry[]>([]);
  const [startDate, setStartDate] = useState("2022-01-01");
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [result, setResult]           = useState<AnalyseResponse | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile]       = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("portfolio_entries");
      if (saved) setEntries(JSON.parse(saved));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const start = localStorage.getItem("portfolio_start_date");
    const end = localStorage.getItem("portfolio_end_date");
    if (start) setStartDate(start);
    if (end) setEndDate(end);
  }, []);

  useEffect(() => {
    localStorage.setItem("portfolio_entries", JSON.stringify(entries));
    localStorage.setItem("portfolio_start_date", startDate);
    localStorage.setItem("portfolio_end_date", endDate);
  }, [entries, startDate, endDate]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const addEntry = useCallback(async (ticker: string, shares: number) => {
    const price = await fetchPrice(ticker);
    setEntries(prev => {
      const existing = prev.findIndex(e => e.ticker === ticker);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = { ticker, shares, price };
        return updated;
      }
      return [...prev, { ticker, shares, price }];
    });
  }, []);

  const removeEntry = useCallback((ticker: string) => {
    setEntries(prev => prev.filter(e => e.ticker !== ticker));
    setResult(null);
  }, []);

  const analyse = useCallback(async () => {
    if (entries.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      const positions: Position[] = entries.map(e => ({ ticker: e.ticker, shares: e.shares }));
      const res = await analysePortfolio({
        positions,
        start_date: startDate,
        end_date: endDate,
        confidence_level: 0.95,
        simulations: 500,
        simulation_days: 252,
      });
      setResult(res);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  }, [entries, startDate, endDate]);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg)" }}>

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 20,
            background: "rgba(0,0,0,0.65)",
          }}
        />
      )}

      {/* Sidebar — always visible on desktop, drawer on mobile */}
      <aside style={{
        position: isMobile ? "fixed" : "relative",
        zIndex: 30,
        height: "100%",
        width: 300,
        flexShrink: 0,
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        transform: isMobile && !sidebarOpen ? "translateX(-100%)" : "translateX(0)",
        transition: "transform 0.3s ease",
      }}>
        <Sidebar
          entries={entries}
          startDate={startDate}
          endDate={endDate}
          loading={loading}
          isMobile={isMobile}
          onAdd={addEntry}
          onRemove={removeEntry}
          onStartDate={setStartDate}
          onEndDate={setEndDate}
          onAnalyse={analyse}
          onClose={() => setSidebarOpen(false)}
        />
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflowY: "auto" }}>

        {/* Mobile top bar */}
        {isMobile && (
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px",
            position: "sticky", top: 0, zIndex: 10,
            background: "var(--bg)", borderBottom: "1px solid var(--border)",
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                padding: "8px 10px", borderRadius: 8,
                background: "var(--surface)", border: "1px solid var(--border)",
                color: "var(--text)", cursor: "pointer",
              }}
            >
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 12h18M3 6h18M3 18h18" strokeLinecap="round"/>
              </svg>
            </button>
            <span className="font-display" style={{ fontSize: "1.2rem", color: "var(--accent-hi)" }}>
              PORTFOLIO RISK
            </span>
          </div>
        )}

        <div style={{ padding: isMobile ? "24px 20px" : "48px 56px", maxWidth: 1200, margin: "0 auto" }}>

          {/* No desktop header — sidebar label serves as the title */}


          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 24, padding: "12px 16px", borderRadius: 8,
              background: "#1a0808", border: "1px solid var(--red)",
              color: "var(--red)", fontSize: "0.85rem",
            }}>
              {error}
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: 16 }}>
              <div style={{
                width: 40, height: 40, borderRadius: "50%",
                border: "2px solid var(--border)", borderTopColor: "var(--accent)",
                animation: "spin 0.8s linear infinite",
              }} />
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", letterSpacing: "0.12em" }}>
                RUNNING ANALYSIS...
              </p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Empty state */}
          {!loading && !result && (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "120px 0", gap: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 16,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "var(--surface)", border: "1px solid var(--border)",
              }}>
                <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" style={{ color: "var(--accent)" }}>
                  <path d="M3 17l4-4 4 4 4-6 4 2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <p className="font-display" style={{ fontSize: "1.6rem", color: "var(--muted)" }}>
                ADD POSITIONS TO BEGIN
              </p>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem", letterSpacing: "0.1em" }}>
                {isMobile ? "TAP THE MENU ICON ABOVE" : "USE THE SIDEBAR TO ADD YOUR HOLDINGS"}
              </p>
            </div>
          )}

          {/* Results */}
          {!loading && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              <MetricGrid result={result} benchmark={result.benchmark} />
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
                <WeightsChart positions={result.positions} />
                {result.correlation && <CorrelationChart correlation={result.correlation} />}
              </div>
              {result.sector_breakdown && <SectorChart sectors={result.sector_breakdown} />}
              {result.monte_carlo && <MonteCarloChart summary={result.monte_carlo} />}
              <CumulativeChart
                dates={result.cumulative_dates}
                values={result.cumulative_returns}
              />
              <AdvisorPrompt result={result} startDate={startDate} endDate={endDate} />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}