from pydantic import BaseModel, Field
from typing import List, Optional

class WorkerProfile(BaseModel):
    user_id: str
    name: str
    skills: List[str] = []
    location: str
    hourly_rate: float
    experience_years: int
    rating_history: float = 5.0
    job_completion_rate: float = 1.0
    cancellation_history: int = 0
    response_time_hours: float = 2.0
    reliability_score: float = 50.0
    reliability_badge: str = "Bronze"
    kyc_status: str = "pending" # pending/verified/rejected
    is_available: bool = True
    total_jobs: int = 0
    disputes: int = 0
    cnic_doc_url: Optional[str] = None
    cert_doc_url: Optional[str] = None
    profile_photo_url: Optional[str] = None
    rejection_reason: Optional[str] = None

class WorkerProfileCreate(BaseModel):
    skills: List[str]
    location: str
    hourly_rate: float
    experience_years: int

class WorkerProfileUpdate(BaseModel):
    skills: Optional[List[str]] = None
    location: Optional[str] = None
    hourly_rate: Optional[float] = None
    experience_years: Optional[int] = None
    is_available: Optional[bool] = None

class WorkerKYCSubmit(BaseModel):
    cnic: str = Field(..., pattern=r"^\d{5}-\d{7}-\d{1}$", description="CNIC formatted as XXXXX-XXXXXXX-X")
    address: str
    skills: List[str]
