import pytest
import numpy as np
from pandas import DataFrame, Series

from portfolio_risk.metrics import calculate_var

@pytest.fixture
def sample_returns_series() -> Series:
    return Series([0.01, -0.02, 0.015, -0.005, 0.02, -0.01, 0.03])

@pytest.fixture
def sample_returns_dataframe() -> DataFrame:
    return DataFrame({
        "AAPL": [0.01, -0.02, 0.015, -0.005, 0.02, -0.01, 0.03],
        "MSFT": [0.02, -0.01, 0.01, -0.015, 0.025, -0.005, 0.02]
    })

def test_calculate_var_returns_none_when_none_passed():
    assert calculate_var(None) is None

def test_calculate_var_returns_positive(sample_returns_series):
    assert calculate_var(sample_returns_series) > 0

def test_calculate_var_99_greater_than_95(sample_returns_series):
    var_95 = calculate_var(sample_returns_series, confidence_level=0.95)
    var_99 = calculate_var(sample_returns_series, confidence_level=0.99)
    assert var_99 > var_95