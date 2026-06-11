from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, List
from database import db
from ml.reliability_model import predict_reliability
from ml.price_model import predict_price
from ml.demand_model import forecast_demand
from spam_classifier import check_review_spam
from dsa.engine import HunarAlgorithmicEngine

router = APIRouter(tags=["ml_dsa"])

class ReliabilityRequest(BaseModel):
    job_count: int = Field(..., ge=0)
    rating: float = Field(..., ge=0.0, le=5.0)
    disputes: int = Field(..., ge=0)
    on_time_rate: float = Field(..., ge=0.0, le=100.0)

class PriceRequest(BaseModel):
    job_type: str
    location: str
    experience_level: int = Field(..., ge=0, le=10)
    demand_index: float = Field(..., ge=0.0, le=100.0)

class SpamRequest(BaseModel):
    review_text: str

# Seeded fallback workers list to run DSA demo if database is empty
MOCK_WORKERS = [
    {"name": "Ahmed Raza", "skills": ["Electrician"], "location": "Gulberg", 
     "hourly_rate": 150.0, "experience_years": 7, "rating_history": 4.5, 
     "job_completion_rate": 0.92, "reliability_score": 85.0, "reliability_badge": "Gold",
     "kyc_status": "verified", "is_available": True, "total_jobs": 143, "disputes": 0},
    {"name": "Hassan Ali", "skills": ["Plumber"], "location": "Johar Town", 
     "hourly_rate": 120.0, "experience_years": 4, "rating_history": 4.1,
     "job_completion_rate": 0.85, "reliability_score": 72.0, "reliability_badge": "Silver",
     "kyc_status": "verified", "is_available": True, "total_jobs": 78, "disputes": 1},
    {"name": "Bilal Khan", "skills": ["Carpenter", "Mason"], "location": "DHA Phase 5",
     "hourly_rate": 200.0, "experience_years": 10, "rating_history": 4.8,
     "job_completion_rate": 0.96, "reliability_score": 91.0, "reliability_badge": "Gold",
     "kyc_status": "verified", "is_available": True, "total_jobs": 215, "disputes": 0},
    {"name": "Zubair Ahmed", "skills": ["AC Technician"], "location": "Model Town",
     "hourly_rate": 250.0, "experience_years": 6, "rating_history": 3.9,
     "job_completion_rate": 0.78, "reliability_score": 65.0, "reliability_badge": "Silver",
     "kyc_status": "pending", "is_available": False, "total_jobs": 52, "disputes": 2},
    {"name": "Tariq Mehmood", "skills": ["Painter"], "location": "Anarkali",
     "hourly_rate": 130.0, "experience_years": 3, "rating_history": 3.5,
     "job_completion_rate": 0.70, "reliability_score": 48.0, "reliability_badge": "Bronze",
     "kyc_status": "verified", "is_available": True, "total_jobs": 34, "disputes": 1},
]

@router.post("/ml/reliability")
async def get_reliability_prediction(req: ReliabilityRequest):
    return predict_reliability(
        job_count=req.job_count,
        rating=req.rating,
        disputes=req.disputes,
        on_time_rate=req.on_time_rate
    )

@router.post("/ml/price")
async def get_price_prediction(req: PriceRequest):
    return predict_price(
        job_type=req.job_type,
        location=req.location,
        experience_level=req.experience_level,
        demand_index=req.demand_index
    )

@router.get("/ml/demand-forecast")
async def get_demand_forecast_predictions():
    return forecast_demand()

@router.post("/ml/spam-check")
async def get_spam_check(req: SpamRequest):
    return check_review_spam(req.review_text)

@router.get("/dsa/demo")
async def run_dsa_demo(skill: Optional[str] = "elect", location: Optional[str] = "Model Town", sort_by: Optional[str] = "hourly_rate"):
    # 1. Fetch available workers from MongoDB
    db_workers = []
    try:
        cursor = db.workers.find({"is_available": True})
        async for doc in cursor:
            doc.pop("_id", None)
            db_workers.append(doc)
    except Exception as e:
        print(f"Error querying workers from database for DSA demo: {e}")

    # Fallback to mock data if DB has no available workers
    workers_to_use = db_workers if db_workers else MOCK_WORKERS
    
    # 2. Run HunarAlgorithmicEngine pipeline
    engine = HunarAlgorithmicEngine(workers_to_use)
    results = engine.run(
        skill_query=skill,
        customer_location=location,
        sort_by=sort_by
    )
    return results
