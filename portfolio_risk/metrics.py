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
    risk_free_rate: float
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
