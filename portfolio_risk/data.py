from pandas import DataFrame
import yfinance as yf

def get_price_data(tickers: list, start_date: str, end_date: str) -> DataFrame | None:
    try:
        data = yf.download(tickers, start=start_date, end=end_date)
        if data.empty:
            return None
        return data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

def get_risk_free_rate() -> float:
    treasury = yf.Ticker("^TNX")
    rate = treasury.fast_info["lastPrice"]
    return rate / 100