import os
import pandas as pd
import numpy as np
import joblib
from datetime import datetime
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LinearRegression
from sklearn.metrics import r2_score, mean_absolute_error

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

MODEL_PATH = "models/demand_model.pkl"

SKILLS = [
    "Electrician", "Plumber", "Carpenter", "AC Technician",
    "Painter", "Tutor", "Driver", "Mason", "Welder",
    "Gardener", "Cook", "Security Guard"
]

def train_model():
    csv_path = "ml/demand_data.csv"
    if not os.path.exists(csv_path):
        from ml.generate_data import generate_all_data
        generate_all_data()
        
    df = pd.read_csv(csv_path)
    
    # Feature Engineering
    # Convert date to datetime to extract month & day of week
    df['datetime'] = pd.to_datetime(df['date'])
    df['month'] = df['datetime'].dt.month
    df['month_sin'] = np.sin(2 * np.pi * df['month'] / 12.0)
    df['month_cos'] = np.cos(2 * np.pi * df['month'] / 12.0)
    
    # Simple lag_7 creation (shift by 7 in sorted records, or fill with median if sparse)
    df = df.sort_values('datetime')
    df['lag_7'] = df['daily_bookings_count'].shift(7).fillna(df['daily_bookings_count'].median())
    
    X = df[["month_sin", "month_cos", "day_of_week", "job_type", "lag_7"]]
    y = df["daily_bookings_count"]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), ["day_of_week", "job_type"])
        ],
        remainder="passthrough"
    )
    
    pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("regressor", LinearRegression())
    ])
    
    pipeline.fit(X, y)
    
    # Evaluate
    y_pred = pipeline.predict(X)
    r2 = r2_score(y, y_pred)
    mae = mean_absolute_error(y, y_pred)
    
    # Directional accuracy
    # Compare if prediction matches actual sign relative to median
    median_val = y.median()
    actual_direction = y > median_val
    pred_direction = y_pred > median_val
    dir_acc = np.mean(actual_direction == pred_direction)
    
    print("=== Demand Model Metrics ===")
    print(f"R2 Score:             {r2:.4f}")
    print(f"MAE:                  {mae:.2f} bookings")
    print(f"Directional Accuracy: {dir_acc * 100:.2f}%")
    print("============================")
    
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def forecast_demand() -> dict:
    """
    Predicts the booking demand for all skill categories for the current month.
    Returns: {
      "demand_forecast": list of {skill, predicted_bookings, trend, badge_color},
      "recommendation": str,
      "total_jobs": int,
      "current_month": str
    }
    """
    if not os.path.exists(MODEL_PATH):
        train_model()
        
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}. Re-training...")
        train_model()
        model = joblib.load(MODEL_PATH)

    now = datetime.now()
    current_month_num = now.month
    current_month_name = now.strftime("%B")
    current_day_name = now.strftime("%A")
    
    month_sin = np.sin(2 * np.pi * current_month_num / 12.0)
    month_cos = np.cos(2 * np.pi * current_month_num / 12.0)
    
    # Predict for each skill
    predictions = []
    
    # Load historical median lag to use for forecast inputs
    try:
        df = pd.read_csv("ml/demand_data.csv")
        median_lag = float(df["daily_bookings_count"].median())
        total_jobs_historical = len(df)
    except:
        median_lag = 10.0
        total_jobs_historical = 600
        
    for skill in SKILLS:
        test_df = pd.DataFrame([{
            "month_sin": month_sin,
            "month_cos": month_cos,
            "day_of_week": current_day_name,
            "job_type": skill,
            "lag_7": median_lag
        }])
        
        try:
            pred = float(model.predict(test_df)[0])
            pred_val = int(round(max(0.0, pred)))
        except:
            # Simple heuristic backup
            # AC Technician high in summer
            # Plumber high in monsoon
            base = 10
            if skill == "AC Technician" and current_month_num in [5, 6, 7]:
                base += 8
            elif skill in ["Plumber", "Mason"] and current_month_num in [7, 8, 9]:
                base += 5
            pred_val = base
            
        # Classify trend
        if pred_val >= 16:
            trend = "High"
            badge_color = "red"
        elif pred_val >= 9:
            trend = "Medium"
            badge_color = "orange"
        else:
            trend = "Stable"
            badge_color = "green"
            
        predictions.append({
            "skill": skill,
            "predicted_bookings": pred_val,
            "trend": trend,
            "badge_color": badge_color
        })
        
    # Sort predictions by bookings descending
    predictions = sorted(predictions, key=lambda x: x["predicted_bookings"], reverse=True)
    top_6 = predictions[:6]
    
    top_skill = top_6[0]["skill"]
    recommendation = f"High demand expected for {top_skill}! Consider promoting this skill category."
    
    return {
        "demand_forecast": top_6,
        "recommendation": recommendation,
        "total_jobs": total_jobs_historical,
        "current_month": current_month_name
    }

if __name__ == "__main__":
    train_model()
