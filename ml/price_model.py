import os
import pandas as pd
import numpy as np
import joblib
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error, root_mean_squared_error

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

MODEL_PATH = "models/price_model.pkl"

BASE_PRICES = {
    "Electrician": 1500, "Plumber": 1200, "Carpenter": 1800,
    "AC Technician": 2000, "Tutor": 1000, "Painter": 1400,
    "Driver": 2000, "Mason": 1600, "Welder": 1700,
    "Gardener": 900, "Cook": 1100, "Security Guard": 1300
}

def train_model():
    csv_path = "ml/price_data.csv"
    if not os.path.exists(csv_path):
        from ml.generate_data import generate_all_data
        generate_all_data()
        
    df = pd.read_csv(csv_path)
    X = df[["job_type", "worker_tier", "city_area", "demand_index"]]
    y = df["suggested_price_pkr"]
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["job_type", "worker_tier", "city_area"])
        ],
        remainder="passthrough"
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", LinearRegression())
    ])
    
    pipeline.fit(X, y)
    
    # Evaluate on the dataset
    y_pred = pipeline.predict(X)
    r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    # scikit-learn 1.4.1 supports root_mean_squared_error directly
    try:
        rmse = root_mean_squared_error(y, y_pred)
    except:
        from sklearn.metrics import mean_squared_error
        rmse = np.sqrt(mean_squared_error(y, y_pred))
        
    print("=== Price Model Metrics ===")
    print(f"R2 Score: {r2:.4f}")
    print(f"MAE:      {mae:.2f} PKR")
    print(f"RMSE:     {rmse:.2f} PKR")
    print("===========================")
    
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def predict_price(job_type: str, location: str, experience_level: int, demand_index: float) -> dict:
    """
    Predicts worker market price using the trained Linear Regression model.
    Falls back to formula if location/job_type is outside bounds.
    """
    if not os.path.exists(MODEL_PATH):
        train_model()
        
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}. Re-training...")
        train_model()
        model = joblib.load(MODEL_PATH)

    # Determine worker tier from experience level (0-9)
    if experience_level < 3:
        worker_tier = "Junior"
    elif experience_level < 7:
        worker_tier = "Mid"
    else:
        worker_tier = "Senior"

    # Map location/neighborhood to one of the seeded cities in dataset if necessary.
    # The dataset uses city_area = ["Gulberg", "Johar Town", "Model Town", "DHA Phase 5", "Anarkali"]
    # If location is not in these, fallback to "Gulberg"
    city_areas = ["Gulberg", "Johar Town", "Model Town", "DHA Phase 5", "Anarkali"]
    matched_area = location if location in city_areas else "Gulberg"

    features = pd.DataFrame([{
        "job_type": job_type,
        "worker_tier": worker_tier,
        "city_area": matched_area,
        "demand_index": demand_index
    }])
    
    try:
        predicted = float(model.predict(features)[0])
        # Round to nearest 50 PKR
        suggested_price = round(max(300.0, predicted), -1)
    except Exception as e:
        # Fallback to formula
        base = BASE_PRICES.get(job_type, 1200)
        exp_multiplier = 1.0 + (experience_level / 10.0)
        demand_multiplier = 1.0 + (demand_index / 100.0)
        suggested_price = base * exp_multiplier * demand_multiplier
        suggested_price = round(max(300.0, suggested_price), -1)

    min_price = round(suggested_price * 0.80, -1)
    max_price = round(suggested_price * 1.20, -1)
    
    return {
        "suggested_price": suggested_price,
        "suggested_range": f"Rs {int(min_price):,} – Rs {int(max_price):,}",
        "min_price": min_price,
        "max_price": max_price
    }

if __name__ == "__main__":
    train_model()
