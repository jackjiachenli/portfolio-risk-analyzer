import pytest
import numpy as np
from pandas import DataFrame, Series


@pytest.fixture
def sample_returns_series() -> Series:
    np.random.seed(42)
    return Series(np.random.normal(0.005    , 0.02, 100))

@pytest.fixture
def sample_returns_dataframe() -> DataFrame:
    return DataFrame({
        "AAPL": [0.01, -0.02, 0.015, -0.005, 0.02, -0.01, 0.03],
        "MSFT": [0.02, -0.01, 0.01, -0.015, 0.025, -0.005, 0.02]
    })

from portfolio_risk.metrics import calculate_var, calculate_cvar

def test_calculate_var_returns_none_when_none_passed():
    assert calculate_var(None) is None

def test_calculate_var_returns_positive(sample_returns_series):
    assert calculate_var(sample_returns_series) > 0

def test_calculate_var_returns_float(sample_returns_series):
    result = calculate_var(sample_returns_series, confidence_level=0.95)
    assert isinstance(result, float)

def test_calculate_cvar_returns_none_when_none_passed():
    assert calculate_cvar(None) is None

def test_calculate_cvar_returns_positive(sample_returns_series):
    assert calculate_cvar(sample_returns_series) > 0

def test_calculate_cvar_returns_float(sample_returns_series):
    result = calculate_cvar(sample_returns_series, confidence_level=0.95)
    assert isinstance(result, float)

from portfolio_risk.metrics import calculate_sharpe_ratio

def test_calculate_sharpe_ratio_returns_none_when_none_passed():
    assert calculate_sharpe_ratio(None, None) is None

def test_calculate_sharpe_returns_none_when_volatility_none():
    assert calculate_sharpe_ratio(0.10, None) is None

def test_calculate_sharpe_returns_none_when_zero_volatility():
    assert calculate_sharpe_ratio(0.10, 0.0) is None

def test_calculate_sharpe_positive_when_return_above_risk_free(sample_returns_series):
    assert calculate_sharpe_ratio(0.10, 0.05) > 0

def test_calculate_sharpe_negative_when_return_below_risk_free():
    assert calculate_sharpe_ratio(0.01, 0.05) < 0

def test_calculate_sharpe_higher_return_higher_sharpe():
    assert calculate_sharpe_ratio(0.15, 0.05) > calculate_sharpe_ratio(0.10, 0.05)

from portfolio_risk.metrics import calculate_annualised_return, calculate_annualised_volatility, calculate_max_drawdown, calculate_correlation_matrix

def test_calculate_annualised_return_none():
    assert calculate_annualised_return(None) is None

def test_calculate_annualised_return_positive(sample_returns_series):
    assert calculate_annualised_return(sample_returns_series) > 0

def test_calculate_annualised_volatility_none():
    assert calculate_annualised_volatility(None) is None

def test_calculate_annualised_volatility_always_positive(sample_returns_series):
    assert calculate_annualised_volatility(sample_returns_series) > 0

def test_calculate_max_drawdown_none():
    assert calculate_max_drawdown(None) is None

def test_calculate_max_drawdown_returns_negative(sample_returns_series):
    assert calculate_max_drawdown(sample_returns_series) < 0

def test_calculate_max_drawdown_between_minus_one_and_zero(sample_returns_series):
    result = calculate_max_drawdown(sample_returns_series)
    assert -1.0 <= result <= 0.0

def test_calculate_correlation_matrix_none():
    assert calculate_correlation_matrix(None) is None

def test_calculate_correlation_matrix_shape(sample_returns_dataframe):
    result = calculate_correlation_matrix(sample_returns_dataframe)
    assert result.shape == (2, 2)

def test_calculate_correlation_matrix_diagonal_is_one(sample_returns_dataframe):
    result = calculate_correlation_matrix(sample_returns_dataframe)
    assert all(result.iloc[i, i] == 1.0 for i in range(len(result)))

def test_calculate_correlation_matrix_values_between_minus_one_and_one(sample_returns_dataframe):
    result = calculate_correlation_matrix(sample_returns_dataframe)
    assert result.values.min() >= -1.0
    assert result.values.max() <= 1.0
