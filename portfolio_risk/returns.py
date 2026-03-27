from pandas import DataFrame
import numpy as np

def calculate_returns(prices: DataFrame | None) -> DataFrame | None:
    if prices is None:
        return None
    
    returns = np.log(prices / prices.shift(1))

    return returns.dropna()