import sys
import os

if os.path.exists("D:\\python_libs"):
    sys.path.insert(0, "D:\\python_libs")

import asyncio
import random
from datetime import datetime

from database import db, check_db_connection
from routers.auth import get_password_hash

FIRST_NAMES = [
    "Ahmed", "Hassan", "Bilal", "Zubair", "Tariq", "Muhammad", "Ali", "Usman", 
    "Hamza", "Zain", "Omer", "Fahad", "Saad", "Abdullah", "Kashif", "Junaid", 
    "Asad", "Farhan", "Yasir", "Salman", "Imran", "Kamran", "Zeeshan", "Nabeel", 
    "Haris", "Waqar", "Aaqib", "Arsalan", "Shoaib", "Babar"
]

LAST_NAMES = [
    "Khan", "Ali", "Raza", "Ahmed", "Mehmood", "Shah", "Butt", "Qureshi", 
    "Abbasi", "Sheikh", "Mughal", "Malik", "Dogar", "Siddiqui", "Javed", "Latif"
]

LOCATIONS = [
    "Model Town", "Johar Town", "Gulberg", "DHA Phase 5", "Anarkali", 
    "Bahria Town", "Iqbal Town", "Wapda Town", "Township", "Garden Town", "Cavalry Ground"
]

SKILLS_LIST = [
    "Electrician", "Plumber", "Carpenter", "AC Technician", "Painter", "Tutor"
]

async def seed_database():
    print("Connecting to database...")
    connected = await check_db_connection()
    if not connected:
        print("Error: Could not connect to database. Make sure MongoDB is running.")
        return

    # Clear existing collections
    print("Clearing existing database collections...")
    await db.users.delete_many({})
    await db.workers.delete_many({})
    await db.jobs.delete_many({})
    await db.kyc.delete_many({})

    # 1. Seed Core Users (Customer, Admin)
    print("Seeding core users...")
    password_hash = get_password_hash("hunar123")

    customer_user = {
        "name": "Test Customer",
        "email": "customer@hunar.pk",
        "password": password_hash,
        "role": "customer",
        "created_at": datetime.utcnow()
    }
    customer_res = await db.users.insert_one(customer_user)
    customer_id = str(customer_res.inserted_id)

    admin_user = {
        "name": "Test Admin",
        "email": "admin@hunar.pk",
        "password": password_hash,
        "role": "admin",
        "created_at": datetime.utcnow()
    }
    admin_res = await db.users.insert_one(admin_user)
    admin_id = str(admin_res.inserted_id)

    # Seed dedicated demo worker account (worker@hunar.pk / hunar123)
    demo_worker_user = {
        "name": "Demo Worker",
        "email": "worker@hunar.pk",
        "password": password_hash,
        "role": "worker",
        "created_at": datetime.utcnow()
    }
    demo_w_res = await db.users.insert_one(demo_worker_user)
    demo_w_id = str(demo_w_res.inserted_id)

    demo_worker_profile = {
        "user_id": demo_w_id,
        "name": "Demo Worker",
        "skills": ["Electrician", "Plumber"],
        "location": "Gulberg",
        "hourly_rate": 200.0,
        "experience_years": 5,
        "rating_history": 4.7,
        "job_completion_rate": 0.95,
        "cancellation_history": 0,
        "response_time_hours": 1.5,
        "reliability_score": 88.0,
        "reliability_badge": "Gold",
        "kyc_status": "verified",
        "is_available": True,
        "total_jobs": 45,
        "disputes": 0,
        "on_time_rate": 95.0,
        "created_at": datetime.utcnow()
    }
    await db.workers.insert_one(demo_worker_profile)
    print("Demo worker (worker@hunar.pk) seeded.")

    # 2. Seed 100 Unique Workers
    print("Generating and seeding 100 unique worker profiles...")
    
    unique_names = set()
    while len(unique_names) < 100:
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)
        name = f"{first} {last}"
        unique_names.add(name)

    workers_list = list(unique_names)
    
    for i, w_name in enumerate(workers_list):
        # Clean email based on name
        email_prefix = w_name.lower().replace(" ", "")
        email = f"{email_prefix}{i}@hunar.pk"
        
        # Randomize profile parameters
        num_skills = random.choice([1, 1, 1, 2]) # Mostly 1 skill, occasionally 2
        skills = random.sample(SKILLS_LIST, num_skills)
        location = random.choice(LOCATIONS)
        hourly_rate = float(random.choice([100, 120, 150, 180, 200, 250, 300, 350, 400]))
        experience_years = random.randint(1, 15)
        rating_history = round(random.uniform(3.5, 5.0), 1)
        job_completion_rate = round(random.uniform(0.70, 1.0), 2)
        total_jobs = random.randint(5, 200)
        disputes = random.choice([0, 0, 0, 0, 0, 0, 1, 2]) # low disputes chance
        cancellations = random.randint(0, 3)
        
        # Calculate mock reliability score
        rel_score = (rating_history / 5.0) * 40.0 + (job_completion_rate * 40.0) + min(total_jobs / 50.0, 1.0) * 20.0
        rel_score -= disputes * 10.0
        rel_score = max(0.0, min(100.0, rel_score))
        
        # Badges
        if rel_score >= 80.0:
            badge = "Gold"
        elif rel_score >= 60.0:
            badge = "Silver"
        else:
            badge = "Bronze"
            
        kyc_status = random.choice(["verified", "verified", "verified", "pending"])
        is_available = True if kyc_status == "verified" else random.choice([True, False])

        # Insert User account
        usr = {
            "name": w_name,
            "email": email,
            "password": password_hash,
            "role": "worker",
            "created_at": datetime.utcnow()
        }
        u_res = await db.users.insert_one(usr)
        w_uid = str(u_res.inserted_id)

        # Insert Worker Profile
        w_profile = {
            "user_id": w_uid,
            "name": w_name,
            "skills": skills,
            "location": location,
            "hourly_rate": hourly_rate,
            "experience_years": experience_years,
            "rating_history": rating_history,
            "job_completion_rate": job_completion_rate,
            "cancellation_history": cancellations,
            "response_time_hours": float(random.choice([1.0, 1.5, 2.0, 3.0])),
            "reliability_score": round(rel_score, 1),
            "reliability_badge": badge,
            "kyc_status": kyc_status,
            "is_available": is_available,
            "total_jobs": total_jobs,
            "disputes": disputes
        }
        await db.workers.insert_one(w_profile)

        # Insert KYC profile
        await db.kyc.insert_one({
            "user_id": w_uid,
            "cnic": f"35201-{random.randint(1000000, 9999999)}-1",
            "address": f"House {random.randint(1, 150)}, Street {random.randint(1, 20)}, {location}, Lahore",
            "skills": skills,
            "submitted_at": datetime.utcnow()
        })

    # 3. Seed 3 Sample Open Jobs
    print("Seeding initial jobs...")
    jobs_seed = [
        {
            "job_id": "job-1",
            "customer_id": customer_id,
            "title": "Need Electrician for AC Wiring",
            "skill_required": "Electrician",
            "location": "Gulberg",
            "budget": 1500.0,
            "description": "I need a professional electrician to fix the master bedroom AC wiring and clean the sockets.",
            "status": "open",
            "worker_id": None,
            "created_at": datetime.utcnow(),
            "price_suggestion": {"min": 1200.0, "max": 1800.0},
            "rating": None,
            "review": None
        },
        {
            "job_id": "job-2",
            "customer_id": customer_id,
            "title": "Leaky Pipe in Kitchen",
            "skill_required": "Plumber",
            "location": "Johar Town",
            "budget": 1000.0,
            "description": "The kitchen sink drain is leaking water. Need immediate sealing or pipe replacement.",
            "status": "open",
            "worker_id": None,
            "created_at": datetime.utcnow(),
            "price_suggestion": {"min": 900.0, "max": 1300.0},
            "rating": None,
            "review": None
        },
        {
            "job_id": "job-3",
            "customer_id": customer_id,
            "title": "Wooden Door Repair",
            "skill_required": "Carpenter",
            "location": "Model Town",
            "budget": 2000.0,
            "description": "The main wooden door hinges are broken and need replacement. Requires wood filing.",
            "status": "open",
            "worker_id": None,
            "created_at": datetime.utcnow(),
            "price_suggestion": {"min": 1600.0, "max": 2400.0},
            "rating": None,
            "review": None
        }
    ]
    await db.jobs.insert_many(jobs_seed)
    
    print("="*60)
    print("Database seeding completed successfully!")
    print(f"Total Workers Generated: 100")
    print(f"Default Customer Login: customer@hunar.pk / hunar123")
    print(f"Default Admin Login:    admin@hunar.pk    / hunar123")
    print("="*60)

if __name__ == "__main__":
    asyncio.run(seed_database())
