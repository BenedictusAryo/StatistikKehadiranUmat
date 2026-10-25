import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database import get_db
from app.models import EventSession, EventPos, MasterPos, EventStatus, User
from app.schemas import (
    EventSessionCreate, EventSessionUpdate, EventSessionResponse,
    EventPosResponse, EvaluationNotes
)
from app.auth import require_litbang_or_admin
from app.cache import stats_cache
import json

router = APIRouter(prefix="/api/events", tags=["Events & Pos Management"])


def _to_naive_utc(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is not None:
        return dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt

@router.get("", response_model=List[EventSessionResponse])
def list_events(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    return db.query(EventSession).order_by(EventSession.start_time.desc()).all()

@router.post("", response_model=EventSessionResponse)
def create_event(
    payload: EventSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    # Calculate capacity target and serialize area_capacities
    event_id = str(uuid.uuid4())
    area_caps_str = None
    capacity_target = payload.capacity_target
    if payload.area_capacities:
        area_caps_str = json.dumps(payload.area_capacities)
        if capacity_target is None:
            capacity_target = sum(payload.area_capacities.values())

    new_event = EventSession(
        id=event_id,
        name=payload.name,
        category=payload.category,
        description=payload.description,
        start_time=_to_naive_utc(payload.start_time),
        end_time=_to_naive_utc(payload.end_time),
        status=EventStatus.SCHEDULED,
        capacity_target=capacity_target,
        enable_capacity_warning=payload.enable_capacity_warning,
        area_capacities=area_caps_str,
        evaluation_notes=payload.evaluation_notes
    )
    db.add(new_event)
    db.flush()

    # Populate Pos: either selected master, custom, or all active MasterPos
    if payload.selected_master_pos_ids and len(payload.selected_master_pos_ids) > 0:
        master_list = db.query(MasterPos).filter(
            MasterPos.id.in_(payload.selected_master_pos_ids),
            MasterPos.is_active == True
        ).order_by(MasterPos.building.asc(), MasterPos.display_order.asc()).all()
        for m in master_list:
            pos = EventPos(
                id=str(uuid.uuid4()),
                event_id=event_id,
                building=m.building or "Gedung Gereja Utama",
                name=m.name,
                code=m.code,
                token=uuid.uuid4().hex[:16],
                is_active=True
            )
            db.add(pos)
    elif payload.custom_pos_names and len(payload.custom_pos_names) > 0:
        for idx, pos_name in enumerate(payload.custom_pos_names):
            if pos_name.strip():
                pos = EventPos(
                    id=str(uuid.uuid4()),
                    event_id=event_id,
                    building="Gedung Gereja Utama",
                    name=pos_name.strip(),
                    code=f"pos-{idx+1}",
                    token=uuid.uuid4().hex[:16],
                    is_active=True
                )
                db.add(pos)
    else:
        # Copy from MasterPos
        master_list = db.query(MasterPos).filter(MasterPos.is_active == True).order_by(MasterPos.building.asc(), MasterPos.display_order.asc()).all()
        if not master_list:
            # Fallback default doors if master table is empty
            defaults = [
                ("Gedung Gereja Utama", "Pintu Utama / Barat", "pintu-barat"),
                ("Gedung Gereja Utama", "Pintu Timur", "pintu-timur"),
                ("Gedung Gereja Utama", "Pintu Utara", "pintu-utara"),
                ("Gedung Gereja Utama", "Pintu Balkon / Tenda", "pintu-balkon"),
            ]
            for bld, name, code in defaults:
                pos = EventPos(
                    id=str(uuid.uuid4()),
                    event_id=event_id,
                    building=bld,
                    name=name,
                    code=code,
                    token=uuid.uuid4().hex[:16],
                    is_active=True
                )
                db.add(pos)
        else:
            for m in master_list:
                pos = EventPos(
                    id=str(uuid.uuid4()),
                    event_id=event_id,
                    building=m.building or "Gedung Gereja Utama",
                    name=m.name,
                    code=m.code,
                    token=uuid.uuid4().hex[:16],
                    is_active=True
                )
                db.add(pos)

    db.commit()
    db.refresh(new_event)
    return new_event

@router.get("/{event_id}", response_model=EventSessionResponse)
def get_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")
    return event

@router.put("/{event_id}", response_model=EventSessionResponse)
def update_event(
    event_id: str,
    payload: EventSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    if payload.name is not None:
        event.name = payload.name
    if payload.category is not None:
        event.category = payload.category
    if payload.description is not None:
        event.description = payload.description
    if payload.start_time is not None:
        event.start_time = _to_naive_utc(payload.start_time)
    if payload.end_time is not None:
        event.end_time = _to_naive_utc(payload.end_time)
    if payload.status is not None:
        if payload.status in [EventStatus.SCHEDULED, EventStatus.OPEN, EventStatus.COMPLETED]:
            event.status = payload.status
    if payload.capacity_target is not None:
        event.capacity_target = payload.capacity_target
    if payload.enable_capacity_warning is not None:
        event.enable_capacity_warning = payload.enable_capacity_warning
    if payload.area_capacities is not None:
        event.area_capacities = json.dumps(payload.area_capacities) if payload.area_capacities else None
        if payload.capacity_target is None and payload.area_capacities:
            event.capacity_target = sum(payload.area_capacities.values())
    if payload.evaluation_notes is not None:
        event.evaluation_notes = payload.evaluation_notes

    db.commit()
    db.refresh(event)
    stats_cache.invalidate(f"stats_{event_id}")
    return event

@router.put("/{event_id}/status")
def update_event_status(
    event_id: str,
    status_value: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    if status_value not in [EventStatus.SCHEDULED, EventStatus.OPEN, EventStatus.COMPLETED]:
        raise HTTPException(status_code=400, detail="Status tidak valid")

    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    event.status = status_value
    db.commit()
    stats_cache.invalidate(f"stats_{event_id}")
    return {"id": event_id, "status": event.status}

@router.put("/{event_id}/evaluation-notes")
def update_event_evaluation_notes(
    event_id: str,
    payload: EvaluationNotes,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    event.evaluation_notes = json.dumps(payload.model_dump())
    db.commit()
    db.refresh(event)
    stats_cache.invalidate(f"stats_{event_id}")
    return {
        "message": "Catatan evaluasi berhasil disimpan",
        "evaluation_notes": event.evaluation_notes
    }

@router.post("/{event_id}/pos", response_model=EventPosResponse)
def add_pos_to_event(
    event_id: str,
    name: str,
    code: Optional[str] = None,
    building: str = "Gedung Gereja Utama",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    clean_code = code if code else name.lower().replace(" ", "-")
    pos = EventPos(
        id=str(uuid.uuid4()),
        event_id=event_id,
        building=building.strip() if building else "Gedung Gereja Utama",
        name=name,
        code=clean_code,
        token=uuid.uuid4().hex[:16],
        is_active=True
    )
    db.add(pos)
    db.commit()
    db.refresh(pos)
    stats_cache.invalidate(f"stats_{event_id}")
    return pos

@router.delete("/{event_id}")
def delete_event(
    event_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    db.delete(event)
    db.commit()
    stats_cache.invalidate(f"stats_{event_id}")
    return {"message": "Event berhasil dihapus"}
