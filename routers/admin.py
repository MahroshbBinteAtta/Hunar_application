from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from typing import List, Annotated, Optional
from database import db
from models.worker import WorkerProfile
from models.job import Job
from routers.auth import get_current_user, UserMe, SECRET_KEY, ALGORITHM
from jose import jwt, JWTError
from datetime import datetime, timedelta
from bson import ObjectId
import os
from pydantic import BaseModel

router = APIRouter(prefix="/admin", tags=["admin"])

class KYCRejectRequest(BaseModel):
    reason: str

class KYCVerifyRequest(BaseModel):
    skills: List[str]

# Helper function to write to audit log
async def log_admin_action(admin_email: str, action: str, details: str):
    log_doc = {
        "admin_email": admin_email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db.audit_logs.insert_one(log_doc)

# Helper function to generate signed URLs for document previews
def create_doc_token(filepath: str) -> str:
    # URL expires in 5 minutes
    expire = datetime.utcnow() + timedelta(minutes=5)
    to_encode = {"filepath": filepath, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def check_admin(current_user: UserMe):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin credentials required."
        )

@router.get("/stats")
async def get_stats(current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    total_users = await db.users.count_documents({})
    total_workers = await db.workers.count_documents({})
    total_jobs = await db.jobs.count_documents({})
    pending_kyc = await db.workers.count_documents({"kyc_status": "pending"})
    active_jobs = await db.jobs.count_documents({"status": "accepted"})
    completed_jobs = await db.jobs.count_documents({"status": "completed"})

    return {
        "total_users": total_users,
        "total_workers": total_workers,
        "total_jobs": total_jobs,
        "pending_kyc": pending_kyc,
        "active_jobs": active_jobs,
        "completed_jobs": completed_jobs
    }

@router.get("/pending-kyc", response_model=List[WorkerProfile])
async def get_pending_kyc(current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    cursor = db.workers.find({"kyc_status": "pending"})
    workers_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        workers_list.append(doc)
    return workers_list

@router.get("/doc-token")
async def get_doc_token(filepath: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)
    
    # Extract filename from url path if passed as http://localhost:8000/uploads/...
    filename = filepath.split("/")[-1]
    local_path = os.path.join("uploads", filename)
    
    if not os.path.exists(local_path):
        raise HTTPException(status_code=404, detail="Physical document file not found on server.")
        
    token = create_doc_token(local_path)
    return {"signed_url": f"http://localhost:8000/admin/doc-preview?token={token}"}

@router.get("/doc-preview")
async def preview_document(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        filepath: str = payload.get("filepath")
        if not filepath or not os.path.exists(filepath):
            raise HTTPException(status_code=404, detail="File not found.")
        return FileResponse(filepath)
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="Signed document URL is invalid or has expired."
        )

@router.put("/verify-kyc/{worker_id}")
async def verify_kyc(worker_id: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    worker = await db.workers.find_one({"user_id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found.")

    await db.workers.update_one(
        {"user_id": worker_id},
        {"$set": {"kyc_status": "verified", "is_available": True, "rejection_reason": None}}
    )
    
    await log_admin_action(
        current_user.email,
        "verify_kyc",
        f"Verified KYC documents and approved worker profile for: {worker['name']} (ID: {worker_id})"
    )
    
    return {"message": f"Worker {worker['name']} has been successfully verified."}

@router.put("/reject-kyc/{worker_id}")
async def reject_kyc(worker_id: str, req: KYCRejectRequest, current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    worker = await db.workers.find_one({"user_id": worker_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found.")

    await db.workers.update_one(
        {"user_id": worker_id},
        {"$set": {"kyc_status": "rejected", "rejection_reason": req.reason, "is_available": False}}
    )

    await log_admin_action(
        current_user.email,
        "reject_kyc",
        f"Rejected KYC documents for worker: {worker['name']} (ID: {worker_id}). Reason: {req.reason}"
    )

    return {"message": f"Worker {worker['name']} KYC submission was rejected."}

@router.get("/users/directory")
async def get_users_directory(current_user: Annotated[UserMe, Depends(get_current_user)], role: Optional[str] = None, q: Optional[str] = None):
    await check_admin(current_user)
    
    query = {}
    if role:
        query["role"] = role
    if q:
        query["$or"] = [
            {"name": {"$regex": q, "$options": "i"}},
            {"email": {"$regex": q, "$options": "i"}}
        ]
        
    cursor = db.users.find(query)
    users_list = []
    async for doc in cursor:
        doc["user_id"] = str(doc["_id"])
        doc.pop("_id", None)
        doc.pop("password", None)
        users_list.append(doc)
    return users_list

@router.put("/users/suspend/{user_id}/{suspend_status}")
async def toggle_suspend_user(user_id: str, suspend_status: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)
    is_suspended = suspend_status.lower() == "true"

    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"is_suspended": is_suspended}}
    )

    # Disable availability for suspended workers
    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": {"is_available": not is_suspended}}
    )

    await log_admin_action(
        current_user.email,
        "suspend_user" if is_suspended else "unsuspend_user",
        f"Set suspended = {is_suspended} for user ID: {user_id}"
    )

    return {"message": f"User suspension state updated to {is_suspended}."}

@router.get("/all-jobs", response_model=List[Job])
async def get_all_jobs(current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    cursor = db.jobs.find()
    jobs_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        jobs_list.append(doc)
    return jobs_list

@router.put("/jobs/force-action/{job_id}/{action_name}", response_model=Job)
async def force_job_action(job_id: str, action_name: str, current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    job = await db.jobs.find_one({"job_id": job_id})
    if not job:
        raise HTTPException(status_code=404, detail="Job not found.")

    if action_name == "complete":
        status_val = "completed"
    elif action_name == "cancel":
        status_val = "cancelled"
    else:
        raise HTTPException(status_code=400, detail="Invalid action name. Use complete or cancel.")

    await db.jobs.update_one(
        {"job_id": job_id},
        {"$set": {"status": status_val}}
    )

    await log_admin_action(
        current_user.email,
        f"force_{action_name}",
        f"Forced job status to '{status_val}' for Job ID: {job_id}"
    )

    updated_job = await db.jobs.find_one({"job_id": job_id})
    updated_job.pop("_id", None)
    return updated_job

@router.get("/audit-logs")
async def get_audit_logs(current_user: Annotated[UserMe, Depends(get_current_user)]):
    await check_admin(current_user)

    cursor = db.audit_logs.find().sort("timestamp", -1)
    logs_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        logs_list.append(doc)
    return logs_list
