"""
AUTHENTICATION VALIDATION SCHEMAS
"""

from typing import Optional, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator
from backend.app.validators.schemas import BloodGroupType, DonorAvailabilityType

# Allowed registration roles (Hospital and Admin cannot register publicly)
PublicRegistrationRole = Literal["patient", "donor"]

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=2, max_length=150)
    role: PublicRegistrationRole = "patient"
    phone_number: Optional[str] = None
    city: Optional[str] = "Metropolis"
    
    # Conditional Donor fields
    blood_group: Optional[BloodGroupType] = None
    date_of_birth: Optional[str] = None
    travel_radius_km: Optional[int] = Field(15, ge=1, le=100)
    latitude: Optional[float] = Field(28.6139, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(77.2090, ge=-180.0, le=180.0)

    @field_validator("role")
    @classmethod
    def validate_public_role(cls, v):
        if v not in ("patient", "donor"):
            raise ValueError("Public registration is allowed only for Patient and Donor.")
        return v

class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    access_token: str = Field(..., min_length=10)
    new_password: str = Field(..., min_length=8, max_length=128)

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=2, max_length=150)
    phone_number: Optional[str] = None
    city: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str = Field(..., min_length=6, max_length=8)
    type: Optional[str] = "signup"

class ResendOtpRequest(BaseModel):
    email: EmailStr
    type: Optional[str] = "signup"


