from ml.demand_model import forecast_demand

def get_demand_forecast() -> dict:
    """
    Exposes demand forecast output wrapper for the FastAPI router.
    """
    return forecast_demand()
