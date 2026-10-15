import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Integer, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole:
    ADMIN = "ADMIN"      # Tim IT
    LITBANG = "LITBANG"  # Tim Litbang

class EventStatus:
    SCHEDULED = "SCHEDULED"
    OPEN = "OPEN"
    COMPLETED = "COMPLETED"

class ChoiceCode:
    PAROKI_BINTARO = "PAROKI_BINTARO"
    LUAR_PAROKI = "LUAR_PAROKI"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(128), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(128), nullable=False)
    role = Column(String(32), default=UserRole.LITBANG, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class MasterPos(Base):
    __tablename__ = "master_pos"

    id = Column(Integer, primary_key=True, index=True)
    building = Column(String(128), default="Gedung Gereja Utama", nullable=False, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(64), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    display_order = Column(Integer, default=0, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

class EventSession(Base):
    __tablename__ = "event_sessions"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String(255), nullable=False)
    category = Column(String(64), default="Misa", nullable=False)
    description = Column(Text, nullable=True)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    status = Column(String(32), default=EventStatus.SCHEDULED, nullable=False)
    capacity_target = Column(Integer, nullable=True)
    enable_capacity_warning = Column(Boolean, default=False, nullable=False)
    area_capacities = Column(Text, nullable=True)  # JSON-encoded dict of per-area capacity targets
    evaluation_notes = Column(Text, nullable=True)  # JSON-encoded notes, observations, and recommendations
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    pos_list = relationship("EventPos", back_populates="event", cascade="all, delete-orphan")
    attendance_logs = relationship("AttendanceLog", back_populates="event", cascade="all, delete-orphan")

class EventPos(Base):
    __tablename__ = "event_pos"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("event_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    building = Column(String(128), default="Gedung Gereja Utama", nullable=False, index=True)
    name = Column(String(128), nullable=False)
    code = Column(String(64), nullable=False)
    token = Column(String(64), unique=True, index=True, default=lambda: uuid.uuid4().hex)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    event = relationship("EventSession", back_populates="pos_list")
    attendance_logs = relationship("AttendanceLog", back_populates="pos", cascade="all, delete-orphan")

class AttendanceLog(Base):
    __tablename__ = "attendance_logs"

    id = Column(String(64), primary_key=True)  # UUID provided by client or server for idempotency
    event_id = Column(String(36), ForeignKey("event_sessions.id", ondelete="CASCADE"), nullable=False, index=True)
    pos_id = Column(String(36), ForeignKey("event_pos.id", ondelete="CASCADE"), nullable=False, index=True)
    choice_code = Column(String(64), nullable=False, index=True)
    client_timestamp = Column(DateTime, nullable=False, index=True)
    server_timestamp = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    metadata_json = Column(Text, nullable=True)  # Extensible JSON for future branching

    event = relationship("EventSession", back_populates="attendance_logs")
    pos = relationship("EventPos", back_populates="attendance_logs")
