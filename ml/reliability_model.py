import os
import pandas as pd
import numpy as np
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Ensure models directory exists
os.makedirs("models", exist_ok=True)

MODEL_PATH = "models/reliability_model.pkl"

def train_model():
    csv_path = "ml/worker_reliability_data.csv"
    if not os.path.exists(csv_path):
        from ml.generate_data import generate_all_data
        generate_all_data()
        
    df = pd.read_csv(csv_path)
    X = df[["job_completion_rate", "avg_star_rating", "cancellation_history", "response_time_hours"]]
    y = df["reliability_label"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", LogisticRegression(random_state=42))
    ])
    
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_prob = pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print("=== Reliability Model Metrics ===")
    print(f"Accuracy:  {acc:.4f}")
    print(f"Precision: {prec:.4f}")
    print(f"Recall:    {rec:.4f}")
    print(f"F1 Score:  {f1:.4f}")
    print(f"AUC-ROC:   {auc:.4f}")
    print("=================================")
    
    joblib.dump(pipeline, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")

def predict_reliability(job_count: int, rating: float, disputes: int, on_time_rate: float) -> dict:
    """
    Computes reliability score and badge using formula, and utilizes 
    Logistic Regression model to classify user.
    """
    # Load model if it exists, otherwise train it
    if not os.path.exists(MODEL_PATH):
        train_model()
        
    try:
        model = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}. Re-training model...")
        train_model()
        model = joblib.load(MODEL_PATH)

    # Core Formula-based Scoring
    # score = (rating/5)*0.40 + (on_time_rate/100)*0.40 + min(job_count/50, 1)*0.20
    # score -= disputes * 0.10
    score = (rating / 5.0) * 0.40 + (on_time_rate / 100.0) * 0.40 + min(job_count / 50.0, 1.0) * 0.20
    score -= disputes * 0.10
    score = max(0.0, min(1.0, score))
    reliability_score = round(score * 100, 1)
    
    # Badge Assignment
    if reliability_score > 80:
        badge = "Gold"
        message = "Exceptional performance and outstanding reliability badge achieved!"
    elif reliability_score > 60:
        badge = "Silver"
        message = "Highly dependable worker maintaining good service standards."
    elif reliability_score > 40:
        badge = "Bronze"
        message = "Acceptable reliability profile. Keep delivering high-quality work to level up."
    else:
        badge = "Needs Review"
        message = "Profile requires review due to low ratings, disputes, or cancellations."

    # Use scikit-learn model to predict likelihood of being a reliable worker
    # Map input parameters to features:
    # job_completion_rate = on_time_rate / 100
    # avg_star_rating = rating
    # cancellation_history = disputes (used as proxy or kept at 0)
    # response_time_hours = 2.0 (assumed mean response time)
    feat_completion = on_time_rate / 100.0
    feat_rating = rating
    feat_cancellation = disputes  # proxy
    feat_response = 2.0
    
    features = pd.DataFrame([{
        "job_completion_rate": feat_completion,
        "avg_star_rating": feat_rating,
        "cancellation_history": feat_cancellation,
        "response_time_hours": feat_response
    }])
    
    model_pred = int(model.predict(features)[0])
    model_prob = float(model.predict_proba(features)[0][1])
    
    return {
        "reliability_score": reliability_score,
        "badge": badge,
        "message": message,
        "is_reliable_prediction": model_pred == 1,
        "reliability_probability": round(model_prob * 100, 1)
    }

if __name__ == "__main__":
    train_model()
