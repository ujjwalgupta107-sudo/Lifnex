"""
LIFNEX PYDANTIC VALIDATION SCHEMAS
Strict type validation and domain constraint enforcement for all 9 entities
"""

from datetime import datetime, date
from typing import Optional, List, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field, field_validator

# Allowed Enums
BloodGroupType = Literal['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
UserRoleType = Literal['patient', 'donor', 'hospital', 'admin']
UrgencyLevelType = Literal['normal', 'urgent', 'critical']
RequestStatusType = Literal['open', 'in_progress', 'fulfilled', 'cancelled', 'expired']
VerificationStatusType = Literal['pending_verification', 'verified', 'rejected']
DonorAvailabilityType = Literal['available', 'busy', 'inactive', 'cooldown']
ResponseStatusType = Literal['accepted', 'declined', 'en_route', 'completed', 'cancelled']

# 1. User Schema
class UserCreate(BaseModel):
    id: str  # Matches auth.users.id
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=150)
    phone_number: Optional[str] = None
    role: UserRoleType = "patient"
    is_active: bool = True
    is_demo: bool = True

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    phone_number: Optional[str]
    role: str
    is_active: bool
    is_demo: bool
    created_at: Optional[datetime] = None

# 2. Donor Profile Schema
class DonorProfileCreate(BaseModel):
    user_id: str
    blood_group: BloodGroupType
    date_of_birth: date
    gender: Optional[Literal['male', 'female', 'other', 'undisclosed']] = 'undisclosed'
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    city: str = Field(..., min_length=2, max_length=100)
    travel_radius_km: int = Field(15, ge=1, le=100)
    availability_status: DonorAvailabilityType = 'available'

class DonorProfileUpdate(BaseModel):
    availability_status: Optional[DonorAvailabilityType] = None
    travel_radius_km: Optional[int] = Field(None, ge=1, le=100)
    latitude: Optional[float] = Field(None, ge=-90.0, le=90.0)
    longitude: Optional[float] = Field(None, ge=-180.0, le=180.0)
    city: Optional[str] = None

# 3. Hospital Schema
class HospitalCreate(BaseModel):
    user_id: str
    name: str = Field(..., min_length=3, max_length=200)
    license_number: str = Field(..., min_length=3, max_length=100)
    address: str = Field(..., min_length=5)
    city: str
    latitude: float = Field(..., ge=-90.0, le=90.0)
    longitude: float = Field(..., ge=-180.0, le=180.0)
    emergency_phone: str
    contact_person: str
    has_blood_bank: bool = True
    current_inventory_status: Optional[Dict[str, Any]] = None

# 4. Blood Request Schema
from datetime import timedelta, timezone as _tz

class BloodRequestCreate(BaseModel):
    patient_id: str
    hospital_id: str
    blood_group: BloodGroupType
    units_required: int = Field(..., ge=1, le=20)
    urgency_level: UrgencyLevelType = 'urgent'
    clinical_notes: Optional[str] = None
    latitude: float = Field(28.6139, ge=-90.0, le=90.0)
    longitude: float = Field(77.2090, ge=-180.0, le=180.0)
    required_by: datetime = Field(default_factory=lambda: datetime.now(_tz.utc) + timedelta(hours=6))
    is_demo: bool = True

    @field_validator("urgency_level", mode="before")
    @classmethod
    def normalize_urgency(cls, v):
        if isinstance(v, str) and v.lower().strip() == "routine":
            return "normal"
        return v.lower().strip() if isinstance(v, str) else v

# 5. Donor Response Schema
class DonorResponseCreate(BaseModel):
    request_id: str
    donor_id: str
    response_status: ResponseStatusType = 'accepted'
    estimated_arrival_minutes: Optional[int] = Field(None, ge=0)
    notes: Optional[str] = None

# 6. Notification Schema
class NotificationCreate(BaseModel):
    recipient_id: str
    reference_request_id: Optional[str] = None
    title: str = Field(..., max_length=150)
    message: str
    notification_type: Literal['emergency_alert', 'response_update', 'verification', 'system'] = 'emergency_alert'

# 7. Donation History Schema
class DonationHistoryCreate(BaseModel):
    donor_id: str
    hospital_id: str
    request_id: Optional[str] = None
    units_donated: int = Field(1, ge=1)
    blood_group: BloodGroupType
    verification_certificate_no: str

# 8. Verification Record Schema
class VerificationRecordCreate(BaseModel):
    target_user_id: str
    verification_type: Literal['hospital_license', 'donor_health_screen', 'medical_request']
    notes: Optional[str] = None

# 9. Audit Log Schema
class AuditLogCreate(BaseModel):
    actor_id: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    client_ip: Optional[str] = None
    old_values: Optional[Dict[str, Any]] = None
    new_values: Optional[Dict[str, Any]] = None
