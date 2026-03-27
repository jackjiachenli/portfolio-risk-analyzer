from pandas import DataFrame
import numpy

def calculate_returns(prices: DataFrame | None) -> DataFrame | None:
    if prices is None:
        return None
    
    returns = numpy.log(prices / prices.shift(1))

    return returns.dropna()