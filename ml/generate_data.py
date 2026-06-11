import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

def generate_all_data():
    os.makedirs("ml", exist_ok=True)
    np.random.seed(42)

    # 1. Generate demand_data.csv (600 records)
    # Columns: job_id, date, day_of_week, job_type, location, daily_bookings_count
    skills = [
        "Electrician", "Plumber", "Carpenter", "AC Technician",
        "Painter", "Tutor", "Driver", "Mason", "Welder",
        "Gardener", "Cook", "Security Guard"
    ]
    cities = ["Lahore", "Karachi", "Islamabad", "Peshawar", "Quetta", "Multan", "Rawalpindi", "Faisalabad"]
    
    start_date = datetime(2024, 1, 1)
    demand_records = []
    
    for i in range(600):
        # random date between Jan 2024 and Dec 2025
        random_days = np.random.randint(0, 730)
        current_date = start_date + timedelta(days=random_days)
        day_name = current_date.strftime("%A")
        month = current_date.month
        
        job_type = np.random.choice(skills)
        loc = np.random.choice(cities)
        
        # Calculate daily bookings count based on seasonality
        base_bookings = np.random.randint(5, 15)
        multiplier = 1.0
        
        # Seasonal adjustments:
        # AC Technician: May-June +60%
        if job_type == "AC Technician" and month in [5, 6]:
            multiplier += 0.60
        # Plumber/Mason: July-September +40% (monsoon)
        elif job_type in ["Plumber", "Mason"] and month in [7, 8, 9]:
            multiplier += 0.40
        # Carpenter/Painter: March-April +20% (pre-Eid)
        elif job_type in ["Carpenter", "Painter"] and month in [3, 4]:
            multiplier += 0.20
            
        # Sunday: +38%
        if day_name == "Sunday":
            multiplier += 0.38
            
        daily_bookings = int(base_bookings * multiplier)
        
        demand_records.append({
            "job_id": f"job_dem_{i}",
            "date": current_date.strftime("%Y-%m-%d"),
            "day_of_week": day_name,
            "job_type": job_type,
            "location": loc,
            "daily_bookings_count": daily_bookings
        })
        
    df_demand = pd.DataFrame(demand_records)
    df_demand.to_csv("ml/demand_data.csv", index=False)
    print("Generated ml/demand_data.csv")

    # 2. Generate worker_reliability_data.csv (700 records)
    # job_completion_rate (beta distribution, mean=0.82)
    # avg_star_rating (1-5)
    # cancellation_history (right-skewed / exponential)
    # response_time_hours (0-48)
    # reliability_label (1=reliable if completion>0.75 AND rating>3.5, else 0)
    
    completion_rates = np.random.beta(a=8, b=2, size=700) # mean ~ 0.80
    star_ratings = np.random.uniform(3.0, 5.0, size=700)
    # force some ratings lower to make it interesting
    low_rating_indices = np.random.choice(700, 70, replace=False)
    star_ratings[low_rating_indices] = np.random.uniform(1.0, 3.0, size=70)
    
    cancellations = np.random.geometric(p=0.4, size=700) - 1 # right-skewed
    response_times = np.random.exponential(scale=10.0, size=700) # mean ~ 10 hours
    response_times = np.clip(response_times, 0.5, 48.0)
    
    reliability_labels = []
    for i in range(700):
        # 1=reliable if completion>0.75 AND rating>3.5 AND cancellation <= 2, else 0
        if completion_rates[i] > 0.75 and star_ratings[i] > 3.5 and cancellations[i] <= 2:
            reliability_labels.append(1)
        else:
            reliability_labels.append(0)
            
    df_reliability = pd.DataFrame({
        "job_completion_rate": completion_rates,
        "avg_star_rating": star_ratings,
        "cancellation_history": cancellations,
        "response_time_hours": response_times,
        "reliability_label": reliability_labels
    })
    df_reliability.to_csv("ml/worker_reliability_data.csv", index=False)
    print("Generated ml/worker_reliability_data.csv")

    # 3. Generate price_data.csv (600 records)
    # Columns: job_type, worker_tier (Junior/Mid/Senior), city_area, demand_index (0-100), historical_avg_price, suggested_price_pkr
    BASE_PRICES = {
        "Electrician": 1500, "Plumber": 1200, "Carpenter": 1800,
        "AC Technician": 2000, "Tutor": 1000, "Painter": 1400,
        "Driver": 2000, "Mason": 1600, "Welder": 1700,
        "Gardener": 900, "Cook": 1100, "Security Guard": 1300
    }
    tiers = ["Junior", "Mid", "Senior"]
    areas = ["Gulberg", "Johar Town", "Model Town", "DHA Phase 5", "Anarkali"]
    
    price_records = []
    for i in range(600):
        job_type = np.random.choice(skills)
        tier = np.random.choice(tiers)
        area = np.random.choice(areas)
        demand_idx = np.random.uniform(10.0, 95.0)
        
        base = BASE_PRICES.get(job_type, 1200)
        
        # Multipliers
        exp_mult = 1.0 if tier == "Junior" else (1.3 if tier == "Mid" else 1.6)
        area_mult = 1.2 if area in ["DHA Phase 5", "Gulberg"] else 1.0
        demand_mult = 1.0 + (demand_idx / 200.0) # up to +47.5%
        
        hist_price = base * exp_mult * area_mult
        suggested = hist_price * demand_mult + np.random.normal(0, 100)
        suggested = max(300, round(suggested, -1)) # round to nearest 10 pkr
        
        price_records.append({
            "job_type": job_type,
            "worker_tier": tier,
            "city_area": area,
            "demand_index": round(demand_idx, 1),
            "historical_avg_price": round(hist_price, -1),
            "suggested_price_pkr": suggested
        })
        
    df_price = pd.DataFrame(price_records)
    df_price.to_csv("ml/price_data.csv", index=False)
    print("Generated ml/price_data.csv")

if __name__ == "__main__":
    generate_all_data()
