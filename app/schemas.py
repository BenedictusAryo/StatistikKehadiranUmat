from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from datetime import datetime
from typing import Optional, List, Dict, Any
import json

# ================= AUTH & USER =================
class UserLogin(BaseModel):
    email: str
    password: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str = "LITBANG"

class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None

class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# ================= MASTER POS =================
class MasterPosBase(BaseModel):
    building: str = "Gedung Gereja Utama"
    name: str
    code: str
    description: Optional[str] = None
    display_order: int = 0
    is_active: bool = True

class MasterPosCreate(MasterPosBase):
    pass

class MasterPosUpdate(BaseModel):
    building: Optional[str] = None
    name: Optional[str] = None
    code: Optional[str] = None
    description: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

class MasterPosResponse(MasterPosBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ================= EVENT & POS =================
class EventPosResponse(BaseModel):
    id: str
    event_id: str
    building: str
    name: str
    code: str
    token: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

# ================= EVALUATION NOTES & OBSERVATIONS =================
class ObservationItem(BaseModel):
    category: str = "Umum"  # "Tata Ruang", "Tata Laksana", "Audio - Visual", "Umum"
    note: str

class EvaluationNotes(BaseModel):
    observations: List[ObservationItem] = []
    recommendations: Optional[str] = None
    conclusion: Optional[str] = None
    photo_url: Optional[str] = None

class EventSessionCreate(BaseModel):
    name: str = Field(..., description="Nama Event, contoh: Misa Natal I - 24 Des Pk 17:00 / Seminar OMK")
    category: str = "Misa"
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    capacity_target: Optional[int] = None
    enable_capacity_warning: bool = False
    area_capacities: Optional[Dict[str, int]] = None
    selected_master_pos_ids: Optional[List[int]] = None
    custom_pos_names: Optional[List[str]] = None
    evaluation_notes: Optional[str] = None

class EventSessionUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: Optional[str] = None
    capacity_target: Optional[int] = None
    enable_capacity_warning: Optional[bool] = None
    area_capacities: Optional[Dict[str, int]] = None
    evaluation_notes: Optional[str] = None

class EventSessionResponse(BaseModel):
    id: str
    name: str
    category: str
    description: Optional[str]
    start_time: datetime
    end_time: Optional[datetime]
    status: str
    capacity_target: Optional[int]
    enable_capacity_warning: bool
    area_capacities: Optional[Dict[str, int]] = None
    evaluation_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    pos_list: List[EventPosResponse] = []

    model_config = ConfigDict(from_attributes=True)

    @field_validator("area_capacities", mode="before")
    @classmethod
    def parse_area_capacities(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return {}
        return v

# ================= COUNTER & SYNC =================
class TapItem(BaseModel):
    id: str  # Client-side UUID
    choice_code: str  # "PAROKI_BINTARO" | "LUAR_PAROKI"
    client_timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class BatchSyncRequest(BaseModel):
    taps: List[TapItem]

class BatchSyncResponse(BaseModel):
    synced_count: int
    already_existed_count: int
    event_status: str
    message: str

class PosAccessValidationResponse(BaseModel):
    event_id: str
    event_name: str
    category: str
    event_status: str
    pos_id: str
    building: str
    pos_name: str
    pos_code: str
    start_time: datetime

# ================= STATS & DASHBOARD =================
class PosStatItem(BaseModel):
    pos_id: str
    building: str
    pos_name: str
    total: int
    paroki_bintaro: int
    luar_paroki: int

class BuildingStatItem(BaseModel):
    building: str
    total: int
    paroki_bintaro: int
    luar_paroki: int
    pos_count: int
    capacity_target: Optional[int] = None
    capacity_percentage: Optional[float] = None
    capacity_status: str = "NORMAL"  # "NORMAL", "WARNING", "FULL"

class TimeSeriesBucket(BaseModel):
    time_label: str  # e.g., "16:45", "17:00"
    total: int
    paroki_bintaro: int
    luar_paroki: int

class LiveStatsResponse(BaseModel):
    event_id: str
    event_name: str
    category: str
    status: str
    start_time: datetime
    capacity_target: Optional[int]
    enable_capacity_warning: bool
    area_capacities: Optional[Dict[str, int]] = None
    total_umat: int
    paroki_bintaro_count: int
    luar_paroki_count: int
    paroki_bintaro_percentage: float
    luar_paroki_percentage: float
    capacity_percentage: Optional[float]
    capacity_status: str  # "NORMAL", "WARNING", "FULL"
    building_breakdown: List[BuildingStatItem] = []
    pos_breakdown: List[PosStatItem]
    time_series: List[TimeSeriesBucket]
    evaluation_notes: Optional[str] = None
    last_updated: datetime
