from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
import pandas as pd
import yfinance as yf

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
    calculate_sortino_ratio,
    calculate_beta,
    calculate_alpha,
    calculate_treynor_ratio,
    calculate_calmar_ratio,
)
from portfolio_risk.simulation import run_monte_carlo

# App

app = FastAPI(
    title="Portfolio Risk Analyzer API",
    description="Quantitative portfolio risk metrics powered by Modern Portfolio Theory",
    version="1.0.0",
)

# CORS

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://*.vercel.app",
        "https://jackjiachenli-portfolio-risk-analyzer.vercel.app",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models

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
    start_date: str
    end_date: str
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
    paths: list[list[float]]
    median_path: list[float]
    p5_path: list[float]
    p95_path: list[float]


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
    sortino_ratio: float | None
    treynor_ratio: float | None
    calmar_ratio: float | None
    beta: float | None
    alpha: float | None
    var: float | None
    cvar: float | None
    max_drawdown: float | None
    correlation: CorrelationMatrix | None
    monte_carlo: MonteCarloSummary | None
    benchmark: BenchmarkData | None
    per_stock_metrics: list[PerStockMetrics] | None
    sector_breakdown: list[SectorBreakdown] | None
    cumulative_returns: list[float] | None
    cumulative_dates: list[str] | None


class PriceResponse(BaseModel):
    ticker: str
    price: float


class BenchmarkData(BaseModel):
    annualised_return: float | None
    annualised_volatility: float | None
    sharpe_ratio: float | None
    sortino_ratio: float | None
    treynor_ratio: float | None
    calmar_ratio: float | None
    max_drawdown: float | None


class PerStockMetrics(BaseModel):
    ticker: str
    annualised_return: float | None
    annualised_volatility: float | None
    sharpe_ratio: float | None
    sortino_ratio: float | None
    treynor_ratio: float | None
    calmar_ratio: float | None
    beta: float | None
    alpha: float | None
    max_drawdown: float | None
    sector: str | None


class SectorBreakdown(BaseModel):
    sector: str
    value: float
    weight: float

MonteCarloSummary.model_rebuild()
AnalyseResponse.model_rebuild()


def get_ticker_sector(ticker: str) -> str:
    try:
        info = yf.Ticker(ticker).info
        # Try sector first (works for individual stocks)
        sector = info.get("sector")
        if sector:
            return sector
        # Fall back to quoteType for ETFs and funds
        quote_type = info.get("quoteType", "")
        if quote_type == "ETF":
            # Use the ETF's category or long name as a descriptor
            category = info.get("category") or info.get("longName", "ETF")
            return f"ETF — {category}"
        if quote_type == "MUTUALFUND":
            return "Mutual Fund"
        return "Unknown"
    except Exception:
        return "Unknown"


def get_spy_returns(start_date: str, end_date: str):
    spy_prices = get_price_data(["SPY"], start_date, end_date)
    if spy_prices is None:
        return None
    if isinstance(spy_prices.columns, pd.MultiIndex):
        spy_prices = spy_prices["Close"]
    return calculate_returns(spy_prices.squeeze())


def get_benchmark_data(spy_returns, risk_free: float) -> BenchmarkData | None:
    if spy_returns is None:
        return None

    ann_return = calculate_annualised_return(spy_returns)
    ann_vol    = calculate_annualised_volatility(spy_returns)
    sharpe     = calculate_sharpe_ratio(ann_return, ann_vol, risk_free)
    sortino    = calculate_sortino_ratio(ann_return, spy_returns, risk_free)
    max_dd     = calculate_max_drawdown(spy_returns)
    # SPY beta vs itself is 1 by definition
    treynor    = calculate_treynor_ratio(ann_return, 1.0, risk_free)
    calmar     = calculate_calmar_ratio(ann_return, max_dd)

    return BenchmarkData(
        annualised_return     = ann_return,
        annualised_volatility = ann_vol,
        sharpe_ratio          = sharpe,
        sortino_ratio         = sortino,
        treynor_ratio         = treynor,
        calmar_ratio          = calmar,
        max_drawdown          = max_dd,
    )


# Endpoints

@app.get("/")
def root():
    return {"status": "ok", "message": "Portfolio Risk Analyzer API"}


@app.get("/price/{ticker}", response_model=PriceResponse)
def get_price(ticker: str):
    """Fetch the current live price for a single ticker."""
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
    sortino    = calculate_sortino_ratio(ann_return, portfolio_returns, risk_free)
    var        = calculate_var(portfolio_returns, request.confidence_level)
    cvar       = calculate_cvar(portfolio_returns, request.confidence_level)
    max_dd     = calculate_max_drawdown(portfolio_returns)
    corr       = calculate_correlation_matrix(returns)

    # Fetch SPY returns once for benchmark, beta, and alpha
    spy_returns = get_spy_returns(request.start_date, request.end_date)
    benchmark   = get_benchmark_data(spy_returns, risk_free)
    beta        = calculate_beta(portfolio_returns, spy_returns)
    alpha       = calculate_alpha(ann_return, beta, benchmark.annualised_return if benchmark else None, risk_free)
    treynor     = calculate_treynor_ratio(ann_return, beta, risk_free)
    calmar      = calculate_calmar_ratio(ann_return, max_dd)

    # Correlation matrix
    correlation = None
    if corr is not None:
        correlation = CorrelationMatrix(
            tickers=corr.columns.tolist(),
            values=corr.values.tolist(),
        )

    # Monte Carlo
    monte_carlo = None
    current_val = total_value
    mc = run_monte_carlo(current_val, ann_return, ann_vol,
                         days=request.simulation_days,
                         simulations=request.simulations)

    if mc is not None:
        final_vals  = mc.iloc[-1]
        median_val  = float(final_vals.median())
        p5_val      = float(final_vals.quantile(0.05))
        p95_val     = float(final_vals.quantile(0.95))
        prob_profit = float((final_vals > current_val).mean() * 100)

        sampled = mc.iloc[:, ::max(1, request.simulations // 100)]
        paths = [[round(v, 2) for v in sampled.iloc[:, i].tolist()] for i in range(sampled.shape[1])]

        monte_carlo = MonteCarloSummary(
            start_value  = current_val,
            median       = median_val,
            median_pct   = (median_val - current_val) / current_val * 100,
            p5           = p5_val,
            p5_pct       = (p5_val - current_val) / current_val * 100,
            p95          = p95_val,
            p95_pct      = (p95_val - current_val) / current_val * 100,
            prob_profit  = prob_profit,
            paths        = paths,
            median_path  = [round(v, 2) for v in mc.median(axis=1).tolist()],
            p5_path      = [round(v, 2) for v in mc.quantile(0.05, axis=1).tolist()],
            p95_path     = [round(v, 2) for v in mc.quantile(0.95, axis=1).tolist()],
        )

    # Per-stock metrics
    per_stock_metrics = []
    sector_values: dict[str, float] = {}
    bench_return = benchmark.annualised_return if benchmark else None
    for i, ticker in enumerate(tickers):
        try:
            sector = get_ticker_sector(ticker)
        except Exception:
            sector = "Unknown"
        sector_values[sector] = sector_values.get(sector, 0.0) + values[i]
        if ticker in returns.columns:
            stock_returns = returns[ticker].dropna()
            s_return  = calculate_annualised_return(stock_returns)
            s_vol     = calculate_annualised_volatility(stock_returns)
            s_sharpe  = calculate_sharpe_ratio(s_return, s_vol, risk_free)
            s_sortino = calculate_sortino_ratio(s_return, stock_returns, risk_free)
            s_beta    = calculate_beta(stock_returns, spy_returns)
            s_alpha   = calculate_alpha(s_return, s_beta, bench_return, risk_free)
            s_max_dd  = calculate_max_drawdown(stock_returns)
            s_treynor = calculate_treynor_ratio(s_return, s_beta, risk_free)
            s_calmar  = calculate_calmar_ratio(s_return, s_max_dd)
            per_stock_metrics.append(PerStockMetrics(
                ticker                = ticker,
                annualised_return     = s_return,
                annualised_volatility = s_vol,
                sharpe_ratio          = s_sharpe,
                sortino_ratio         = s_sortino,
                treynor_ratio         = s_treynor,
                calmar_ratio          = s_calmar,
                beta                  = s_beta,
                alpha                 = s_alpha,
                max_drawdown          = s_max_dd,
                sector                = sector,
            ))

    sector_breakdown = [
        SectorBreakdown(sector=s, value=v, weight=v / total_value)
        for s, v in sorted(sector_values.items(), key=lambda x: x[1], reverse=True)
    ]

    # Get cumulative data
    cumulative = (1 + portfolio_returns).cumprod().tolist()
    dates = portfolio_returns.index.strftime("%Y-%m-%d").tolist()

    return AnalyseResponse(
        positions             = positions_detail,
        total_value           = total_value,
        risk_free_rate        = risk_free,
        annualised_return     = ann_return,
        annualised_volatility = ann_vol,
        sharpe_ratio          = sharpe,
        sortino_ratio         = sortino,
        treynor_ratio         = treynor,
        calmar_ratio          = calmar,
        beta                  = beta,
        alpha                 = alpha,
        var                   = var,
        cvar                  = cvar,
        max_drawdown          = max_dd,
        correlation           = correlation,
        monte_carlo           = monte_carlo,
        benchmark             = benchmark,
        per_stock_metrics     = per_stock_metrics or None,
        sector_breakdown      = sector_breakdown or None,
        cumulative_returns    = cumulative,
        cumulative_dates      = dates,
    )