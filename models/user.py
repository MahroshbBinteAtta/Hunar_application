from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    role: str = Field(..., pattern="^(customer|worker|admin)$")
    otp: str = Field(..., min_length=6, max_length=6)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: str

class UserMe(BaseModel):
    user_id: str
    name: str
    email: str
    role: str

class AdminLogin(BaseModel):
    email: EmailStr
    password: str
    otp: str
