from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile
from typing import List, Annotated, Optional
import os
from database import db
from models.worker import WorkerProfile, WorkerProfileCreate, WorkerProfileUpdate, WorkerKYCSubmit
from routers.auth import get_current_user, UserMe
from ml.reliability_model import predict_reliability

def validate_mime_and_size(file_bytes: bytes, content_type: str, max_size_mb: float = 5.0):
    if len(file_bytes) > max_size_mb * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds the 5MB limit.")
        
    header = file_bytes[:4]
    is_pdf = header.startswith(b'%PDF')
    is_png = header.startswith(b'\x89PNG')
    is_jpg = header.startswith(b'\xff\xd8\xff')
    
    if not (is_pdf or is_png or is_jpg):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only PDF, PNG, and JPG/JPEG files are allowed."
        )

router = APIRouter(prefix="/worker", tags=["worker"])

@router.post("/profile/{user_id}", response_model=WorkerProfile)
async def create_profile(user_id: str, profile_in: WorkerProfileCreate, current_user: Annotated[UserMe, Depends(get_current_user)]):
    # Verify authorization
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this profile."
        )

    # Check if worker already exists
    existing = await db.workers.find_one({"user_id": user_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Worker profile already exists. Use PUT to update."
        )

    reliability_stats = predict_reliability(
        job_count=0,
        rating=5.0,
        disputes=0,
        on_time_rate=100.0
    )

    worker_doc = {
        "user_id": user_id,
        "name": current_user.name,
        "skills": profile_in.skills,
        "location": profile_in.location,
        "hourly_rate": profile_in.hourly_rate,
        "experience_years": profile_in.experience_years,
        "rating_history": 5.0,
        "job_completion_rate": 1.0,
        "cancellation_history": 0,
        "response_time_hours": 2.0,
        "reliability_score": reliability_stats["reliability_score"],
        "reliability_badge": reliability_stats["badge"],
        "kyc_status": "pending",
        "is_available": True,
        "total_jobs": 0,
        "disputes": 0
    }

    await db.workers.insert_one(worker_doc)
    return worker_doc

@router.get("/profile/{user_id}", response_model=WorkerProfile)
async def get_profile(user_id: str):
    worker = await db.workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile not found."
        )
    # Remove MongoDB internal _id for validation
    worker.pop("_id", None)
    return worker

@router.put("/profile/{user_id}", response_model=WorkerProfile)
async def update_profile(user_id: str, profile_in: WorkerProfileUpdate, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this profile."
        )

    existing = await db.workers.find_one({"user_id": user_id})
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile does not exist."
        )

    # Filter updates
    update_data = {}
    if profile_in.skills is not None:
        update_data["skills"] = profile_in.skills
    if profile_in.location is not None:
        update_data["location"] = profile_in.location
    if profile_in.hourly_rate is not None:
        update_data["hourly_rate"] = profile_in.hourly_rate
    if profile_in.experience_years is not None:
        update_data["experience_years"] = profile_in.experience_years
    if profile_in.is_available is not None:
        update_data["is_available"] = profile_in.is_available

    # Re-calculate reliability
    total_jobs = existing.get("total_jobs", 0)
    rating = existing.get("rating_history", 5.0)
    disputes = existing.get("disputes", 0)
    completion_rate = existing.get("job_completion_rate", 1.0)
    on_time_rate = completion_rate * 100.0

    reliability_stats = predict_reliability(
        job_count=total_jobs,
        rating=rating,
        disputes=disputes,
        on_time_rate=on_time_rate
    )
    update_data["reliability_score"] = reliability_stats["reliability_score"]
    update_data["reliability_badge"] = reliability_stats["badge"]

    await db.workers.update_one({"user_id": user_id}, {"$set": update_data})
    
    updated_profile = await db.workers.find_one({"user_id": user_id})
    updated_profile.pop("_id", None)
    return updated_profile

@router.post("/kyc/{user_id}")
async def submit_kyc(user_id: str, kyc_in: WorkerKYCSubmit, current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to submit KYC for this user."
        )
        
    worker = await db.workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Worker profile must be created before submitting KYC."
        )

    # Save to a kyc collection or inline
    await db.kyc.update_one(
        {"user_id": user_id},
        {"$set": {
            "cnic": kyc_in.cnic,
            "address": kyc_in.address,
            "skills": kyc_in.skills,
            "submitted_at": kyc_in.cnic # or datetime
        }},
        upsert=True
    )
    
    # Update worker status to pending verification
    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": {"kyc_status": "pending", "skills": kyc_in.skills}}
    )
    
    return {"message": "KYC details submitted successfully and are now pending approval."}

@router.get("/all", response_model=List[WorkerProfile])
async def get_all_workers(current_user: Annotated[UserMe, Depends(get_current_user)]):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Admin role required."
        )
        
    cursor = db.workers.find()
    workers_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        workers_list.append(doc)
    return workers_list

@router.get("/available", response_model=List[WorkerProfile])
async def get_available_workers():
    # Fetch workers who are available and verified by KYC
    cursor = db.workers.find({"is_available": True, "kyc_status": "verified"})
    workers_list = []
    async for doc in cursor:
        doc.pop("_id", None)
        workers_list.append(doc)
    return workers_list

@router.post("/upload-docs/{user_id}")
async def upload_docs(
    user_id: str,
    current_user: Annotated[UserMe, Depends(get_current_user)],
    cnic_file: UploadFile = File(...),
    cert_file: Optional[UploadFile] = File(None),
    profile_photo: Optional[UploadFile] = File(None)
):
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized.")

    worker = await db.workers.find_one({"user_id": user_id})
    if not worker:
        raise HTTPException(status_code=404, detail="Worker profile not found.")

    os.makedirs("uploads", exist_ok=True)
    update_fields = {}

    async def process_file(upload_file: UploadFile, prefix: str):
        content = await upload_file.read()
        validate_mime_and_size(content, upload_file.content_type)
        
        orig_name = upload_file.filename or ""
        ext = ".png"
        if orig_name.lower().endswith(".pdf"):
            ext = ".pdf"
        elif orig_name.lower().endswith((".jpg", ".jpeg")):
            ext = ".jpg"
            
        filename = f"{user_id}_{prefix}{ext}"
        filepath = os.path.join("uploads", filename)
        
        with open(filepath, "wb") as f:
            f.write(content)
            
        return f"http://localhost:8000/uploads/{filename}"

    try:
        cnic_url = await process_file(cnic_file, "cnic")
        update_fields["cnic_doc_url"] = cnic_url

        if cert_file:
            cert_url = await process_file(cert_file, "cert")
            update_fields["cert_doc_url"] = cert_url

        if profile_photo:
            photo_url = await process_file(profile_photo, "photo")
            update_fields["profile_photo_url"] = photo_url
            
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File save error: {str(e)}")

    await db.workers.update_one(
        {"user_id": user_id},
        {"$set": update_fields}
    )

    return {"message": "Documents uploaded successfully.", "urls": update_fields}
