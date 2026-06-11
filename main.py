import sys
import os

if os.path.exists("D:\\python_libs"):
    sys.path.insert(0, "D:\\python_libs")
import logging

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import check_db_connection
from websocket_manager import manager

# Import routers
from routers.auth import router as auth_router
from routers.worker import router as worker_router
from routers.jobs import router as jobs_router
from routers.admin import router as admin_router
from routers.ml import router as ml_router

# Import ML training routines
from ml.generate_data import generate_all_data
from ml.reliability_model import train_model as train_reliability
from ml.price_model import train_model as train_price
from ml.demand_model import train_model as train_demand

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("hunar_main")

app = FastAPI(title="HUNAR API", version="1.0.0")

# CORS middleware configuration
allowed_origins = ["http://localhost:5173", "http://localhost:3000"]
frontend_url = os.getenv("FRONTEND_URL")
if frontend_url:
    allowed_origins.append(frontend_url)
    allowed_origins.append(frontend_url.rstrip("/"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routes
app.include_router(auth_router)
app.include_router(worker_router)
app.include_router(jobs_router)
app.include_router(admin_router)
app.include_router(ml_router)

from fastapi.staticfiles import StaticFiles
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# WebSocket connection path for workers
@app.websocket("/ws/{worker_id}")
async def websocket_endpoint(websocket: WebSocket, worker_id: str):
    await manager.connect(worker_id, websocket)
    try:
        while True:
            # Maintain connection, discard client messages
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(worker_id)
    except Exception as e:
        logger.error(f"WebSocket error for worker {worker_id}: {e}")
        manager.disconnect(worker_id)

@app.on_event("startup")
async def startup_event():
    # 1. Check MongoDB connectivity
    await check_db_connection()
    
    # 2. Trigger ML models training if they do not exist
    logger.info("Checking ML models status...")
    if not os.path.exists("ml/worker_reliability_data.csv") or not os.path.exists("ml/price_data.csv") or not os.path.exists("ml/demand_data.csv"):
        logger.info("Synthetic datasets not found. Generating data...")
        generate_all_data()

    if not os.path.exists("models/reliability_model.pkl"):
        logger.info("Reliability model pickle not found. Training...")
        train_reliability()
        
    if not os.path.exists("models/price_model.pkl"):
        logger.info("Pricing model pickle not found. Training...")
        train_price()
        
    if not os.path.exists("models/demand_model.pkl"):
        logger.info("Demand model pickle not found. Training...")
        train_demand()
        
    logger.info("FastAPI HUNAR backend fully initialized.")

@app.get("/")
async def health_check():
    return {"status": "HUNAR API running"}
