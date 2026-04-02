from pandas import DataFrame, Series
import numpy as np

def calculate_annualised_return(returns: DataFrame | None) -> float | None:
    if returns is None:
        return None

    return returns.mean() * 252

def calculate_annualised_volatility(returns: DataFrame | None) -> float | None:
    if returns is None:
        return None

    return returns.std() * np.sqrt(252)

def calculate_sharpe_ratio(
    annualised_return: float | None, 
    annualised_volatility: float | None, 
    risk_free_rate: float = 0.042
) -> float | None:
    if annualised_return is None or annualised_volatility is None:
        return None

    if annualised_volatility == 0:
        return None

    return (annualised_return - risk_free_rate) / annualised_volatility

def calculate_correlation_matrix(returns: DataFrame | None) -> DataFrame | None:
    if returns is None:
        return None
    return returns.corr()

def calculate_portfolio_returns(
    returns: DataFrame | None,
    weights: list[float] | None
) -> Series | None:
    if returns is None:
        return None
    if weights is None:
        return None
    if round(sum(weights), 6) != 1.0:
        raise ValueError("Weights must sum to 1.0")

    portfolio_return = (returns * weights).sum(axis=1)
    return portfolio_return

def calculate_var(
    returns: Series | None,
    confidence_level: float = 0.95
) -> float | None:
    if returns is None:
        return None
    
    var = abs(returns.quantile(1-confidence_level))
    return var

def calculate_cvar(
    returns: Series | None,
    confidence_level: float = 0.95
) -> float | None:
    if returns is None:
        return None

    var_threshold = calculate_var(returns, confidence_level)
    if var_threshold is None:
        return None

    filtered = returns[returns < -var_threshold]
    if filtered.empty:
        return 0.0

    return abs(filtered.mean())

def calculate_max_drawdown(
    returns: Series | None
) -> float | None:
    if returns is None:
        return None

    cumulative = (1 + returns).cumprod()
    peak = cumulative.cummax()

    drawdown = (cumulative - peak) / peak
    return drawdown.min()

def calculate_sortino_ratio(
    annualised_return: float | None,
    returns: Series | None,
    risk_free_rate: float = 0.042
) -> float | None:
    if annualised_return is None or returns is None:
        return None

    downside = returns[returns < 0]
    if len(downside) < 2:
        return None

    downside_std = downside.std() * np.sqrt(252)
    if downside_std == 0:
        return None

    return (annualised_return - risk_free_rate) / downside_std

def calculate_beta(
    portfolio_returns: Series | None,
    benchmark_returns: Series | None,
) -> float | None:
    if portfolio_returns is None or benchmark_returns is None:
        return None

    aligned_p, aligned_b = portfolio_returns.align(benchmark_returns, join="inner")
    if len(aligned_p) < 2:
        return None

    cov_matrix = np.cov(aligned_p, aligned_b)
    bench_var = cov_matrix[1, 1]
    if bench_var == 0:
        return None

    return float(cov_matrix[0, 1] / bench_var)

def calculate_alpha(
    annualised_return: float | None,
    beta: float | None,
    benchmark_annualised_return: float | None,
    risk_free_rate: float = 0.042
) -> float | None:
    if any(x is None for x in [annualised_return, beta, benchmark_annualised_return]):
        return None

    return annualised_return - risk_free_rate - beta * (benchmark_annualised_return - risk_free_rate)
