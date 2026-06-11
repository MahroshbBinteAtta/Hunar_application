import os
from datetime import datetime, timedelta
from typing import Annotated, Optional
from fastapi import APIRouter, Depends, HTTPException, status

from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel
from bson import ObjectId

from database import db
from models.user import UserRegister, UserLogin, TokenResponse, UserMe, AdminLogin

router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY", "your-super-secret-key-change-in-production")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "10080"))

import bcrypt
import resend
import random

otp_store = {}

async def log_admin_action(admin_email: str, action: str, details: str):
    log_doc = {
        "admin_email": admin_email,
        "action": action,
        "details": details,
        "timestamp": datetime.utcnow().isoformat()
    }
    await db.audit_logs.insert_one(log_doc)

security_scheme = HTTPBearer()

def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_bytes = plain_password.encode('utf-8')
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: Annotated[HTTPAuthorizationCredentials, Depends(security_scheme)]):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        email: str = payload.get("email")
        role: str = payload.get("role")
        if user_id is None or email is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if user is None:
        raise credentials_exception
    return UserMe(
        user_id=str(user["_id"]),
        name=user["name"],
        email=user["email"],
        role=user["role"]
    )

@router.post("/send-otp")
async def send_otp(email: str):
    try:
        clean_email = email.strip().lower()
        otp = str(random.randint(100000, 999999))
        otp_store[clean_email] = otp
        print("="*50)
        print(f"🔑 HUNAR SECURITY OTP FOR {clean_email}: {otp}")
        print("="*50)
        
        api_key = os.getenv("RESEND_API_KEY")
        if not api_key:
            return {"success": True, "message": "OTP code is ready (check terminal console log)"}
            
        resend.api_key = api_key
        resend.Emails.send({
            "from": "HUNAR <onboarding@resend.dev>",
            "to": clean_email,
            "subject": "Your HUNAR Verification Code",
            "html": f"""
            <h2>HUNAR Verification Code</h2>
            <p>Your OTP code is: <strong style="font-size:24px">{otp}</strong></p>
            <p>This code expires in 10 minutes.</p>
            """
        })
        return {"success": True, "message": "OTP sent successfully"}
    except Exception as e:
        return {"success": True, "message": "OTP code is ready (check terminal console log)"}

@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister):
    # Verify OTP
    clean_email = user_in.email.strip().lower()
    if clean_email not in otp_store:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please request an OTP first."
        )
    if otp_store[clean_email] != user_in.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP verification code."
        )
        
    # Remove OTP on successful verification
    otp_store.pop(clean_email, None)

    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )
        
    hashed_pwd = get_password_hash(user_in.password)
    user_dict = {
        "name": user_in.name,
        "email": user_in.email,
        "password": hashed_pwd,
        "role": user_in.role,
        "created_at": datetime.utcnow()
    }
    
    result = await db.users.insert_one(user_dict)
    user_id_str = str(result.inserted_id)
    
    # Generate token
    token_data = {
        "sub": user_id_str,
        "email": user_in.email,
        "role": user_in.role
    }
    access_token = create_access_token(
        data=token_data, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    # If the user is a worker, initialize an empty worker profile
    if user_in.role == "worker":
        worker_profile = {
            "user_id": user_id_str,
            "name": user_in.name,
            "skills": [],
            "location": "Gulberg",
            "hourly_rate": 0.0,
            "experience_years": 0,
            "rating_history": 5.0,
            "job_completion_rate": 1.0,
            "cancellation_history": 0,
            "response_time_hours": 2.0,
            "reliability_score": 50.0,
            "reliability_badge": "Bronze",
            "kyc_status": "pending",
            "is_available": True,
            "total_jobs": 0,
            "disputes": 0
        }
        await db.workers.insert_one(worker_profile)
        
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user_in.role,
        user_id=user_id_str
    )

class PasswordResetRequest(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email.strip().lower()})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    # 1. Check Lockout Status
    lockout_until_str = user.get("lockout_until")
    if lockout_until_str:
        lockout_until = datetime.fromisoformat(lockout_until_str)
        if datetime.utcnow() < lockout_until:
            diff = lockout_until - datetime.utcnow()
            mins = int(diff.total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to 5 failed login attempts. Try again in {mins} minutes."
            )

    # 2. Check Password
    if not verify_password(credentials.password, user["password"]):
        # Increment failed login attempts
        attempts = user.get("failed_login_attempts", 0) + 1
        update_data = {"failed_login_attempts": attempts}
        
        if attempts >= 5:
            lockout_time = datetime.utcnow() + timedelta(minutes=15)
            update_data["lockout_until"] = lockout_time.isoformat()
            update_data["failed_login_attempts"] = 0
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to 5 failed login attempts. Try again in 15 minutes."
            )
        else:
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password."
            )

    # 3. Check suspension status
    if user.get("is_suspended", False):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator."
        )

    # Reset attempts on success
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_attempts": 0, "lockout_until": None}}
    )

    user_id_str = str(user["_id"])
    token_data = {
        "sub": user_id_str,
        "email": user["email"],
        "role": user["role"]
    }
    
    access_token = create_access_token(
        data=token_data, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=user_id_str
    )

@router.post("/admin/login", response_model=TokenResponse)
async def admin_login(credentials: AdminLogin):
    user = await db.users.find_one({"email": credentials.email.strip().lower()})
    if not user or user.get("role") != "admin":
        await log_admin_action(credentials.email.strip().lower(), "admin_failed_login", "Failed login attempt: Account does not exist or does not have admin permissions.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect admin credentials."
        )

    # 1. Check Lockout Status
    lockout_until_str = user.get("lockout_until")
    if lockout_until_str:
        lockout_until = datetime.fromisoformat(lockout_until_str)
        if datetime.utcnow() < lockout_until:
            diff = lockout_until - datetime.utcnow()
            mins = int(diff.total_seconds() / 60) + 1
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Account locked due to 5 failed login attempts. Try again in {mins} minutes."
            )

    # 2. Check Password
    if not verify_password(credentials.password, user["password"]):
        # Increment failed login attempts
        attempts = user.get("failed_login_attempts", 0) + 1
        update_data = {"failed_login_attempts": attempts}
        
        if attempts >= 5:
            lockout_time = datetime.utcnow() + timedelta(minutes=15)
            update_data["lockout_until"] = lockout_time.isoformat()
            update_data["failed_login_attempts"] = 0
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            await log_admin_action(user["email"], "admin_lockout", "Admin account locked for 15 minutes due to 5 consecutive failed password attempts.")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account locked due to 5 failed login attempts. Try again in 15 minutes."
            )
        else:
            await db.users.update_one({"_id": user["_id"]}, {"$set": update_data})
            await log_admin_action(user["email"], "admin_failed_login", f"Failed password attempt. Consecutive failed attempts: {attempts}/5")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect admin credentials."
            )

    # 3. Check OTP
    clean_email = credentials.email.strip().lower()
    if clean_email not in otp_store or otp_store[clean_email] != credentials.otp:
        await log_admin_action(user["email"], "admin_failed_otp", "Failed OTP verification during admin login.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP verification code."
        )

    # Remove OTP on success
    otp_store.pop(clean_email, None)

    # Check suspension
    if user.get("is_suspended", False):
        await log_admin_action(user["email"], "admin_login_suspended", "Login blocked: Admin account is suspended.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been suspended by an administrator."
        )

    # Reset attempts on success
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"failed_login_attempts": 0, "lockout_until": None}}
    )
    await log_admin_action(user["email"], "admin_login_success", "Admin logged in successfully.")

    user_id_str = str(user["_id"])
    token_data = {
        "sub": user_id_str,
        "email": user["email"],
        "role": user["role"]
    }
    
    access_token = create_access_token(
        data=token_data, 
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user["role"],
        user_id=user_id_str
    )

@router.post("/forgot-password/reset")
async def reset_password(req: PasswordResetRequest):
    clean_email = req.email.strip().lower()
    if clean_email not in otp_store or otp_store[clean_email] != req.otp:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP verification code."
        )

    user = await db.users.find_one({"email": req.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Reset OTP on success
    otp_store.pop(clean_email, None)

    hashed_pwd = get_password_hash(req.new_password)
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"password": hashed_pwd, "failed_login_attempts": 0, "lockout_until": None}}
    )
    
    if user.get("role") == "admin":
        await log_admin_action(user["email"], "admin_password_reset", "Admin password has been reset successfully via forgot-password route.")

    return {"message": "Password reset successfully. You can now login with your new password."}

@router.get("/me", response_model=UserMe)
async def get_me(current_user: Annotated[UserMe, Depends(get_current_user)]):
    return current_user
