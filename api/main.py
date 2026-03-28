from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import pandas as pd

from portfolio_risk.data import get_price_data, get_risk_free_rate
from portfolio_risk.returns import calculate_returns
from portfolio_risk.metrics import (
    calculate_annualised_return,
    calculate_annualised_volatility,
    calculate_sharpe_ratio,
    calculate_correlation_matrix,
    calculate_portfolio_returns,
    calculate_var,
    calculate_cvar,
    calculate_max_drawdown,
)
from portfolio_risk.simulation import run_monte_carlo

app = FastAPI(
    title="Portfolio Risk Analyzer API",
    description="Quantitative portfolio risk metrics powered by Modern Portfolio Theory",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Position(BaseModel):
    ticker: str
    shares: float

    @field_validator("ticker")
    @classmethod
    def ticker_must_be_uppercase(cls, v: str) -> str:
        return v.upper().strip()

    @field_validator("shares")
    @classmethod
    def shares_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Shares must be greater than 0")
        return v


class AnalyseRequest(BaseModel):
    positions: list[Position]
    start_date: str   # "YYYY-MM-DD"
    end_date: str     # "YYYY-MM-DD"
    confidence_level: float = 0.95
    simulations: int = 500
    simulation_days: int = 252


class PositionDetail(BaseModel):
    ticker: str
    shares: float
    current_price: float
    value: float
    weight: float


class MonteCarloSummary(BaseModel):
    start_value: float
    median: float
    median_pct: float
    p5: float
    p5_pct: float
    p95: float
    p95_pct: float
    prob_profit: float


class CorrelationMatrix(BaseModel):
    tickers: list[str]
    values: list[list[float]]


class AnalyseResponse(BaseModel):
    positions: list[PositionDetail]
    total_value: float
    risk_free_rate: float
    annualised_return: float | None
    annualised_volatility: float | None
    sharpe_ratio: float | None
    var: float | None
    cvar: float | None
    max_drawdown: float | None
    correlation: CorrelationMatrix | None
    monte_carlo: MonteCarloSummary | None


class PriceResponse(BaseModel):
    ticker: str
    price: float



# Endpoints
@app.get("/")
def root():
    return {"status": "ok", "message": "Portfolio Risk Analyzer API"}


@app.get("/price/{ticker}", response_model=PriceResponse)
def get_price(ticker: str):
    """Fetch the current live price for a single ticker."""
    import yfinance as yf
    try:
        price = float(yf.Ticker(ticker.upper()).fast_info["lastPrice"])
        return PriceResponse(ticker=ticker.upper(), price=price)
    except Exception:
        raise HTTPException(status_code=404, detail=f"Could not fetch price for {ticker}")


@app.post("/analyse", response_model=AnalyseResponse)
def analyse(request: AnalyseRequest):
    """
    Run a full portfolio risk analysis.

    Accepts a list of positions (ticker + shares), fetches historical price data,
    calculates all risk metrics, and runs a Monte Carlo simulation.
    """
    if not request.positions:
        raise HTTPException(status_code=400, detail="Portfolio must have at least one position")

    if len(request.positions) > 20:
        raise HTTPException(status_code=400, detail="Maximum 20 positions supported")

    # Fetch current prices
    import yfinance as yf

    tickers = [p.ticker for p in request.positions]
    shares  = [p.shares for p in request.positions]

    current_prices = []
    for ticker in tickers:
        try:
            price = float(yf.Ticker(ticker).fast_info["lastPrice"])
            current_prices.append(price)
        except Exception:
            raise HTTPException(status_code=404, detail=f"Could not fetch price for {ticker}")

    values      = [s * p for s, p in zip(shares, current_prices)]
    total_value = sum(values)
    weights     = [v / total_value for v in values]

    positions_detail = [
        PositionDetail(
            ticker=tickers[i],
            shares=shares[i],
            current_price=current_prices[i],
            value=values[i],
            weight=weights[i],
        )
        for i in range(len(tickers))
    ]

    # Fetch historical data
    price_data = get_price_data(tickers, request.start_date, request.end_date)

    if price_data is None:
        raise HTTPException(status_code=400, detail="Failed to fetch historical price data — check your tickers and date range")

    if isinstance(price_data.columns, pd.MultiIndex):
        price_data = price_data["Close"]

    # Calculate metrics
    returns           = calculate_returns(price_data)
    portfolio_returns = calculate_portfolio_returns(returns, weights)
    risk_free         = get_risk_free_rate()

    ann_return = calculate_annualised_return(portfolio_returns)
    ann_vol    = calculate_annualised_volatility(portfolio_returns)
    sharpe     = calculate_sharpe_ratio(ann_return, ann_vol, risk_free)
    var        = calculate_var(portfolio_returns, request.confidence_level)
    cvar       = calculate_cvar(portfolio_returns, request.confidence_level)
    max_dd     = calculate_max_drawdown(portfolio_returns)
    corr       = calculate_correlation_matrix(returns)

    # Correlation matrix
    correlation = None
    if corr is not None:
        correlation = CorrelationMatrix(
            tickers=corr.columns.tolist(),
            values=corr.values.tolist(),
        )

    # Monte Carlo
    monte_carlo = None
    current_val = float((1 + portfolio_returns).cumprod().iloc[-1]) * total_value
    mc = run_monte_carlo(current_val, ann_return, ann_vol,
                         days=request.simulation_days,
                         simulations=request.simulations)

    if mc is not None:
        final_vals  = mc.iloc[-1]
        median_val  = float(final_vals.median())
        p5_val      = float(final_vals.quantile(0.05))
        p95_val     = float(final_vals.quantile(0.95))
        prob_profit = float((final_vals > current_val).mean() * 100)

        monte_carlo = MonteCarloSummary(
            start_value  = current_val,
            median       = median_val,
            median_pct   = (median_val - current_val) / current_val * 100,
            p5           = p5_val,
            p5_pct       = (p5_val - current_val) / current_val * 100,
            p95          = p95_val,
            p95_pct      = (p95_val - current_val) / current_val * 100,
            prob_profit  = prob_profit,
        )

    return AnalyseResponse(
        positions          = positions_detail,
        total_value        = total_value,
        risk_free_rate     = risk_free,
        annualised_return  = ann_return,
        annualised_volatility = ann_vol,
        sharpe_ratio       = sharpe,
        var                = var,
        cvar               = cvar,
        max_drawdown       = max_dd,
        correlation        = correlation,
        monte_carlo        = monte_carlo,
    )