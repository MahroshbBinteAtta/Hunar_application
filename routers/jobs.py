import uuid
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Annotated
from bson import ObjectId

from database import db
from models.job import Job, JobCreate, JobRateSubmit
from routers.auth import get_current_user, UserMe
from websocket_manager import manager
from ml.price_model import predict_price
from spam_classifier import check_review_spam
from ml.reliability_model import predict_reliability

router = APIRouter(prefix="/jobs", tags=["jobs"])

@router.post("", response_model=Job)
async def post_job(job_in: JobCreate, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can post job requests."
        )

    # 1. Fetch pricing prediction
    # Get worker experience index average (e.g. 5) and average demand index (e.g. 50)
    price_stats = predict_price(
        job_type=job_in.skill_required,
        location=job_in.location,
        experience_level=5,
        demand_index=50.0
    )
    
    # Enforce minimum budget constraint from ML pricing model
    min_allowable = price_stats.get("min_price", 0.0)
    if job_in.budget < min_allowable:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Budget Rs {job_in.budget} is below the suggested fair market minimum of Rs {min_allowable}. Please increase budget to protect labor rates."
        )
    
    # 2. Build Job document
    job_id = str(uuid.uuid4())
    job_doc = {
        "job_id": job_id,
        "customer_id": current_user.user_id,
        "title": job_in.title,
        "skill_required": job_in.skill_required,
        "location": job_in.location,
        "budget": job_in.budget,
        "description": job_in.description,
        "status": "open",
        "worker_id": None,
        "created_at": datetime.utcnow(),
        "price_suggestion": {
            "min": price_stats["min_price"],
            "max": price_stats["max_price"]
        },
        "rating": None,
        "review": None
    }
    
    await db.jobs.insert_one(job_doc)
    
    # 3. Broadcast to all active workers
    ws_payload = {
        "type": "new_job",
        "job_id": job_id,
        "title": job_in.title,
        "location": job_in.location,
        "budget": job_in.budget,
        "skill_required": job_in.skill_required,
        "message": f"New {job_in.skill_required} job available in {job_in.location}!"
    }
    await manager.broadcast(ws_payload)
    
    return job_doc

@router.get("/open", response_model=List[Job])
async def get_open_jobs():
    cursor = db.jobs.find({"status": "open"})
    jobs_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        jobs_list.append(doc)
    return jobs_list

@router.get("/customer/{user_id}", response_model=List[Job])
async def get_customer_jobs(user_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    cursor = db.jobs.find({"customer_id": user_id})
    jobs_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        jobs_list.append(doc)
    return jobs_list

@router.get("/worker/{worker_id}", response_model=List[Job])
async def get_worker_jobs(worker_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.user_id != worker_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied."
        )
    cursor = db.jobs.find({"worker_id": worker_id})
    jobs_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        jobs_list.append(doc)
    return jobs_list

@router.put("/accept/{job_id}/{worker_id}", response_model=Job)
async def accept_job(job_id: str, worker_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.user_id != worker_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You cannot accept jobs on behalf of this worker."
        )

    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    if job["status"] != "open":
        raise HTTPException(status_code=400, detail="This job has already been accepted or closed.")

    worker = await db.workers.find_one({"user_id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found.")
    if worker["kyc_status"] != "verified":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker must be KYC verified by an admin before accepting jobs."
        )

    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": "accepted", "worker_id": worker_id}}
    )

    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job

@router.put("/complete/{job_id}", response_model=Job)
async def complete_job(job_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
    
    # Only customer or assigned worker can mark job as complete
    if current_user.user_id != job["customer_id"] and current_user.user_id != job["worker_id"] and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized action.")

    if job["status"] != "accepted":
        raise HTTPException(status_code=400, detail="Only accepted jobs can be marked as complete.")

    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": "completed"}}
    )

    # Increment worker total jobs and recalculate reliability
    worker_id = job["worker_id"]
    worker = await db.workers.find_one({"user_id": worker_id})
    if worker:
        new_total_jobs = worker.get("total_jobs", 0) + 1
        
        # Calculate completion rate (assuming all completed except disputes/cancellations)
        disputes = worker.get("disputes", 0)
        cancellations = worker.get("cancellation_history", 0)
        
        # simple completion rate estimate
        completion_rate = max(0.5, 1.0 - (cancellations / max(1, new_total_jobs)))
        on_time_rate = completion_rate * 100.0
        rating = worker.get("rating_history", 5.0)

        reliability_stats = predict_reliability(
            job_count=new_total_jobs,
            rating=rating,
            disputes=disputes,
            on_time_rate=on_time_rate
        )

        await db.workers.update_one(
            {"user_id": worker_id},
            {"$set": {
                "total_jobs": new_total_jobs,
                "job_completion_rate": round(completion_rate, 2),
                "reliability_score": reliability_stats["reliability_score"],
                "reliability_badge": reliability_stats["badge"]
            }}
        )

    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job

@router.post("/rate/{job_id}", response_model=Job)
async def rate_job(job_id: str, rating_in: JobRateSubmit, current_user: Annotated[UserMe, Depends(get_current_user)]):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.user_id != job["customer_id"]:
        raise HTTPException(status_code=403, detail="Only the hiring customer can review this job.")

    if job["status"] != "completed":
        raise HTTPException(status_code=400, detail="Ratings can only be submitted for completed jobs.")

    # Spam detection check on optional review text
    if rating_in.review and rating_in.review.strip():
        spam_result = check_review_spam(rating_in.review)
        if spam_result["is_spam"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Review rejected by AI spam detection. Reason: {spam_result['reason']}"
            )

    # Calculate aggregate rating from the 3 micro-dimensions
    avg_score = round((rating_in.rating_quality + rating_in.rating_punctuality + rating_in.rating_communication) / 3.0, 1)

    # Save review details to job
    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {
            "rating": avg_score,
            "rating_quality": rating_in.rating_quality,
            "rating_punctuality": rating_in.rating_punctuality,
            "rating_communication": rating_in.rating_communication,
            "review": rating_in.review
        }}
    )

    # Recalculate worker rating history & reliability badge
    worker_id = job["worker_id"]
    worker = await db.workers.find_one({"user_id": worker_id})
    if worker:
        # Fetch all ratings for this worker
        cursor = db.jobs.find({"worker_id": worker_id, "rating": {"$ne": None}})
        ratings = []
        async for doc in cursor:
            ratings.append(doc["rating"])
        
        avg_rating = round(sum(ratings) / len(ratings), 1)
        total_jobs = worker.get("total_jobs", 0)
        disputes = worker.get("disputes", 0)
        completion_rate = worker.get("job_completion_rate", 1.0)
        on_time_rate = completion_rate * 100.0

        reliability_stats = predict_reliability(
            job_count=total_jobs,
            rating=avg_rating,
            disputes=disputes,
            on_time_rate=on_time_rate
        )

        await db.workers.update_one(
            {"user_id": worker_id},
            {"$set": {
                "rating_history": avg_rating,
                "reliability_score": reliability_stats["reliability_score"],
                "reliability_badge": reliability_stats["badge"]
            }}
        )

    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job

@router.put("/status/{job_id}/{status_name}", response_model=Job)
async def update_job_status(job_id: str, status_name: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.user_id != job["worker_id"] and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only the assigned worker can update the travel status.")
        
    allowed_statuses = ["accepted", "en_route", "arrived", "in_progress", "completed", "cancelled"]
    if status_name not in allowed_statuses:
        raise HTTPException(status_code=400, detail="Invalid job status transition.")
        
    if status_name == "completed":
        return await complete_job(job_id, current_user)
        
    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": status_name}}
    )
    
    # Broadcast status update to WebSocket connections
    ws_payload = {
        "type": "job_status_update",
        "job_id": job_id,
        "status": status_name,
        "message": f"Job status updated to: {status_name}"
    }
    await manager.broadcast(ws_payload)
    
    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job

@router.post("/report/{job_id}", response_model=Job)
async def report_job_dispute(job_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")
        
    if current_user.user_id != job["customer_id"] and current_user.user_id != job["worker_id"]:
        raise HTTPException(status_code=403, detail="Only the customer or worker associated with this job can raise a dispute.")
        
    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": "disputed"}}
    )
    
    # Increment worker dispute count and recalculate reliability
    worker_id = job.get("worker_id")
    if worker_id:
        worker = await db.workers.find_one({"user_id": worker_id})
        if worker:
            new_disputes = worker.get("disputes", 0) + 1
            total_jobs = worker.get("total_jobs", 0)
            rating = worker.get("rating_history", 5.0)
            completion_rate = worker.get("job_completion_rate", 1.0)
            on_time_rate = completion_rate * 100.0
            
            reliability_stats = predict_reliability(
                job_count=total_jobs,
                rating=rating,
                disputes=new_disputes,
                on_time_rate=on_time_rate
            )
            
            await db.workers.update_one(
                {"user_id": worker_id},
                {"$set": {
                    "disputes": new_disputes,
                    "reliability_score": reliability_stats["reliability_score"],
                    "reliability_badge": reliability_stats["badge"]
                }}
            )

    # Broadcast WebSocket update
    ws_payload = {
        "type": "job_dispute",
        "job_id": job_id,
        "status": "disputed",
        "message": "This job has been flagged as disputed. Admin review is pending."
    }
    await manager.broadcast(ws_payload)

    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job
