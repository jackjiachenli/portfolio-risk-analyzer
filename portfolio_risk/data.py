from pandas import DataFrame
import yfinance

def get_price_data(tickers: list, start_date: str, end_date: str) -> DataFrame | None:
    try:
        data = yfinance.download(tickers, start=start_date, end=end_date)
        if data.empty:
            return None
        return data
    except Exception as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    result = get_price_data(["AAPL", "MSFT"], "2023-01-01", "2023-02-01")
    print(result)