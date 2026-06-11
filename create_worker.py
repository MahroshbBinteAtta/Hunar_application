import sys
import os

if os.path.exists("D:\\python_libs"):
    sys.path.insert(0, "D:\\python_libs")

import asyncio
import database
from routers.auth import get_password_hash

async def main():
    await database.check_db_connection()
    
    email = "testworker@hunar.pk"
    existing = await database.db.users.find_one({"email": email})
    if existing:
        print(f"User {email} already exists!")
        user_id = str(existing["_id"])
    else:
        password_hash = get_password_hash("hunar123")
        user_doc = {
            "name": "Test Worker",
            "email": email,
            "password": password_hash,
            "role": "worker"
        }
        res = await database.db.users.insert_one(user_doc)
        user_id = str(res.inserted_id)
        print(f"Created user account with ID: {user_id}")

    worker = await database.db.workers.find_one({"user_id": user_id})
    if not worker:
        worker_doc = {
            "user_id": user_id,
            "name": "Test Worker",
            "skills": ["Electrician", "Plumber"],
            "location": "Gulberg",
            "hourly_rate": 350.0,
            "experience_years": 5,
            "rating_history": 5.0,
            "job_completion_rate": 1.0,
            "cancellation_history": 0,
            "response_time_hours": 2.0,
            "reliability_score": 85.0,
            "reliability_badge": "Gold",
            "kyc_status": "verified",
            "is_available": True,
            "total_jobs": 10,
            "disputes": 0
        }
        await database.db.workers.insert_one(worker_doc)
        print("Created worker profile")
        
        await database.db.kyc.update_one(
            {"user_id": user_id},
            {"$set": {
                "cnic": "35201-1234567-1",
                "address": "House 10, Gulberg, Lahore",
                "skills": ["Electrician", "Plumber"]
            }},
            upsert=True
        )
        print("Created/updated KYC record")
    else:
        await database.db.workers.update_one(
            {"user_id": user_id},
            {"$set": {"kyc_status": "verified", "is_available": True}}
        )
        print("Verified existing worker profile")

if __name__ == "__main__":
    asyncio.run(main())
