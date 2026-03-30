# Portfolio Risk Analyzer

A quantitative portfolio risk analysis tool built with Next.js and FastAPI. Enter your stock holdings and get a full breakdown of risk metrics, correlation analysis, Monte Carlo simulation, and an AI-ready prompt for personalised portfolio advice.

---

## Live Demo

A hosted version is available at [jackjiachenli-portfolio-risk-analyzer.vercel.app](https://jackjiachenli-portfolio-risk-analyzer.vercel.app).

Note: the backend is hosted on Render's free tier and may take up to 30 seconds to respond on the first request after a period of inactivity. Subsequent requests will be fast.

If you prefer to run the app locally with no cold start, see [Getting Started](#getting-started) below.

---

## Features

### Risk Metrics

The dashboard calculates six core risk metrics for your portfolio:

- **Annualised Return** — your portfolio's average yearly return over the selected historical period
- **Annualised Volatility** — how much your returns fluctuate year to year, a direct measure of risk
- **Sharpe Ratio** — return per unit of risk, adjusted for the risk-free rate (US 10yr Treasury). Above 1.0 is considered good, above 2.0 excellent
- **Value at Risk (VaR 95%)** — the maximum daily loss you can expect on 95% of trading days
- **Conditional VaR (CVaR 95%)** — the average loss on the worst 5% of days, a more conservative risk measure than VaR alone
- **Max Drawdown** — the worst peak-to-trough decline your portfolio has experienced in the selected period

### Portfolio Input

Positions are entered as share quantities rather than dollar amounts. The app fetches live prices automatically and calculates dollar values and weights in real time. Fractional shares are supported. Your portfolio is saved to browser localStorage and restored on your next visit.

### Correlation Matrix

Shows how your holdings move relative to each other on a scale of -1 to 1. Holdings close to 1.0 are highly correlated and move together, which means you have less true diversification than the number of positions suggests.

### Portfolio Weights

A breakdown of your portfolio allocation by dollar value, showing the percentage weight of each position.

### Monte Carlo Simulation

Runs 500 simulated future paths for your portfolio using Geometric Brownian Motion, projecting forward from your current portfolio value. The chart shows:

- Individual dimmed paths representing each simulation
- The median expected outcome
- The 95th percentile (best 5% of scenarios)
- The 5th percentile (worst 5% of scenarios)
- Probability that the portfolio finishes above its starting value

This gives you a realistic range of outcomes rather than a single point forecast.

### AI Advisor Prompt

Generates a structured prompt containing your full portfolio data, all risk metrics, correlation matrix, and Monte Carlo summary. Copy and paste it into any AI chatbot (Claude, ChatGPT, Gemini) to receive personalised, data-driven advice on what to hold, reduce, or diversify into.

---

## Tech Stack

- **Frontend** — Next.js, TypeScript, Tailwind CSS, Plotly.js
- **Backend** — FastAPI, Python
- **Data** — yfinance (market data and live prices), US Treasury API (risk-free rate)
- **Risk models** — Modern Portfolio Theory, Geometric Brownian Motion

---

## Project Structure

```
portfolio-risk-analyzer/
├── api/
│   └── main.py                FastAPI backend
├── frontend/
│   ├── app/
│   │   ├── page.tsx           Main dashboard page
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── sidebar.tsx        Portfolio input and controls
│   │   ├── metric-grid.tsx    Risk metric cards
│   │   ├── correlation.tsx    Correlation heatmap
│   │   ├── weights.tsx        Portfolio weights pie chart
│   │   ├── monte-carlo.tsx    Monte Carlo simulation chart
│   │   ├── cumulative.tsx     Cumulative return chart
│   │   └── advisor.tsx        AI prompt generator
│   └── lib/
│       └── api.ts             API client and TypeScript types
├── portfolio_risk/
│   ├── data.py                Price and risk-free rate fetching
│   ├── returns.py             Log returns calculation
│   ├── metrics.py             VaR, CVaR, Sharpe, drawdown etc
│   └── simulation.py          Monte Carlo simulation
└── tests/
    └── test_metrics.py        Pytest test suite
```

---

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+

### Backend

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Start the API
uvicorn api.main:app --reload
```

API runs at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:3000`.

---

## Running Tests

```bash
pytest
```

---

## Roadmap

### Risk & Metrics

- Per-stock breakdown of return, volatility, and Sharpe ratio alongside portfolio-level metrics
- Beta per holding — how much each stock amplifies or dampens market movements
- Proper historical cumulative return chart using actual day-by-day price data rather than the current approximation

### Portfolio Intelligence

- Sector and asset class breakdown fetched automatically from yfinance
- Dividend yield per holding for income-focused analysis
- Fundamental data (P/E ratio, market cap) included in the AI advisor prompt for valuation context
- Efficient frontier visualisation showing the optimal risk/return allocation across your holdings

### Simulation

- Configurable simulation horizon — currently fixed at 252 days
- Stress testing against historical market crashes (2008, 2020 COVID drawdown etc)
- Correlation-aware Monte Carlo that accounts for how your holdings move together rather than simulating each independently

### Experience

- CSV export of all metrics and simulation results
- Portfolio snapshot history so you can track how your risk profile changes over time
- Multiple saved portfolios — useful for comparing a current vs target allocation

---

## Limitations

- Risk metrics are calculated from historical data and do not predict future performance
- Monte Carlo simulation assumes constant drift and volatility based on the historical period selected
- The cumulative return chart is an approximation based on average daily return, not actual historical price movements
- Live price data depends on yfinance availability
