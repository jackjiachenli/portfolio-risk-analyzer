from pandas import DataFrame
import numpy as np

def run_monte_carlo(
    s0: float,              # current price
    mu: float | None,       # annualised return
    sigma: float | None,    # annualised volatility
    days: int = 252,
    simulations: int = 1000
) -> DataFrame | None:
    """
    Run a Monte Carlo simulation using Geometric Brownian Motion.
    
    s0: initial/current price
    mu: annualised expected return
    sigma: annualised volatility
    diffusion: sigma * sqrt(dt) — volatility scaled to one trading day
    """
    
    if mu is None or sigma is None:
        return None
    
    dt = 1 / 252

    drift = (mu - 0.5 * sigma ** 2) * dt
    diffusion = sigma * np.sqrt(dt)

    paths = np.zeros((days, simulations))

    paths[0] = s0

    for t in range(1, days):
        z = np.random.normal(0, 1, simulations)
        shock = diffusion * z
        paths[t] = paths[t-1] * np.exp(drift + shock)

    return DataFrame(paths)