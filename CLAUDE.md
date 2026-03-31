# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend

```bash
# Install dependencies (from repo root)
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Run the API server
uvicorn api.main:app --reload
# → http://localhost:8000  (Swagger UI at /docs)

# Run tests
pytest

# Run a single test
pytest tests/test_metrics.py::test_name
```

### Frontend

```bash
cd frontend
npm install
npm run dev    # → http://localhost:3000
npm run build
npm run lint   # ESLint 9
```

## Architecture

This is a full-stack quantitative portfolio analysis tool. The Python backend exposes a REST API; the Next.js frontend fetches from it.

### Backend (`api/` + `portfolio_risk/`)

`api/main.py` defines two real endpoints:
- `GET /price/{ticker}` — live price lookup via yfinance
- `POST /analyse` — full risk analysis pipeline

The analysis pipeline in `POST /analyse`:
1. Fetches live prices to compute dollar values and weights
2. Calls `portfolio_risk/data.py` → yfinance historical OHLCV, then extracts `Close` (handles MultiIndex for multi-ticker responses)
3. `portfolio_risk/returns.py` → log returns via `np.log(prices / prices.shift(1))`
4. `portfolio_risk/metrics.py` → 6 metrics (annualised return/vol, Sharpe, VaR 95%, CVaR 95%, max drawdown) + correlation matrix
5. `portfolio_risk/simulation.py` → Geometric Brownian Motion Monte Carlo (default 500 paths × 252 days)
6. Fetches SPY benchmark metrics using the same pipeline

Risk-free rate defaults to 0.042 (4.2%) but is fetched from the 13-week Treasury if available.

### Frontend (`frontend/`)

- `app/page.tsx` — top-level state (positions, date range, results) with localStorage persistence; orchestrates API calls
- `components/sidebar.tsx` — portfolio entry form + date pickers + analyse trigger
- `components/*.tsx` — each chart/metric is its own component (Plotly.js)
- `lib/api.ts` — typed fetch wrapper; TypeScript interfaces mirror the Pydantic response models

### Next.js version note

This project uses **Next.js 16**, which has breaking changes from earlier versions. Before editing frontend code, read the relevant guide in `frontend/node_modules/next/dist/docs/`.

### Deployment

- Frontend: Vercel
- Backend: Render (free tier — expect ~30s cold start)
- CORS in `api/main.py` is configured for localhost:3000 and the Vercel deployment URL

### Constraints

- Maximum 20 positions per analysis request (enforced in API)
- Monte Carlo assumes constant drift/volatility (GBM)
- `cumulative_returns` in the response is an approximation, not actual price movement
