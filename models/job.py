from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime

class PriceSuggestionRange(BaseModel):
    min: float
    max: float

class Job(BaseModel):
    job_id: str
    customer_id: str
    title: str
    skill_required: str
    location: str
    budget: float
    description: str
    status: str = "open" # open/accepted/completed/cancelled
    worker_id: Optional[str] = None
    created_at: datetime
    price_suggestion: Optional[PriceSuggestionRange] = None
    rating: Optional[float] = None
    rating_quality: Optional[float] = None
    rating_punctuality: Optional[float] = None
    rating_communication: Optional[float] = None
    review: Optional[str] = None

class JobCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=100)
    skill_required: str
    location: str
    budget: float = Field(..., gt=0)
    description: str = Field(..., min_length=10)

class JobRateSubmit(BaseModel):
    rating_quality: int = Field(..., ge=1, le=5)
    rating_punctuality: int = Field(..., ge=1, le=5)
    rating_communication: int = Field(..., ge=1, le=5)
    review: Optional[str] = None
