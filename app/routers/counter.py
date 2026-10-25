import json
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import EventSession, EventPos, AttendanceLog, EventStatus
from app.schemas import (
    BatchSyncRequest, BatchSyncResponse, PosAccessValidationResponse
)
from app.cache import stats_cache

router = APIRouter(prefix="/api/counter", tags=["Counter & Offline Sync"])

@router.get("/validate/{token}", response_model=PosAccessValidationResponse)
def validate_pos_token(token: str, db: Session = Depends(get_db)):
    pos = db.query(EventPos).filter(EventPos.token == token, EventPos.is_active == True).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Tautan Pos tidak valid atau telah dinonaktifkan")

    event = db.query(EventSession).filter(EventSession.id == pos.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    return {
        "event_id": event.id,
        "event_name": event.name,
        "category": event.category,
        "event_status": event.status,
        "pos_id": pos.id,
        "building": getattr(pos, "building", "Gedung Gereja Utama") or "Gedung Gereja Utama",
        "pos_name": pos.name,
        "pos_code": pos.code,
        "start_time": event.start_time
    }

@router.post("/{token}/sync", response_model=BatchSyncResponse)
def sync_taps(
    token: str,
    payload: BatchSyncRequest,
    db: Session = Depends(get_db)
):
    pos = db.query(EventPos).filter(EventPos.token == token, EventPos.is_active == True).first()
    if not pos:
        raise HTTPException(status_code=404, detail="Tautan Pos tidak valid")

    event = db.query(EventSession).filter(EventSession.id == pos.event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    if event.status == EventStatus.COMPLETED:
        return {
            "synced_count": 0,
            "already_existed_count": 0,
            "event_status": event.status,
            "message": "Event telah selesai. Tap baru tidak dicatat."
        }

    if not payload.taps:
        return {
            "synced_count": 0,
            "already_existed_count": 0,
            "event_status": event.status,
            "message": "Tidak ada data tap untuk disinkronkan"
        }

    # Extract all tap IDs in this batch
    incoming_ids = [t.id for t in payload.taps if t.id]
    
    # Query existing IDs to ensure idempotency
    existing_rows = db.query(AttendanceLog.id).filter(AttendanceLog.id.in_(incoming_ids)).all()
    existing_id_set = {row[0] for row in existing_rows}

    new_logs = []
    server_now = datetime.utcnow()

    for tap in payload.taps:
        if tap.id in existing_id_set:
            continue
        
        meta_str = json.dumps(tap.metadata) if tap.metadata else None

        # Parse or use client_timestamp (stored as naive UTC in DB)
        c_time = tap.client_timestamp
        if isinstance(c_time, str):
            try:
                c_time = datetime.fromisoformat(c_time.replace("Z", "+00:00"))
            except Exception:
                c_time = server_now
        if isinstance(c_time, datetime) and c_time.tzinfo is not None:
            from datetime import timezone
            c_time = c_time.astimezone(timezone.utc).replace(tzinfo=None)

        log = AttendanceLog(
            id=tap.id,
            event_id=event.id,
            pos_id=pos.id,
            choice_code=tap.choice_code,
            client_timestamp=c_time,
            server_timestamp=server_now,
            metadata_json=meta_str
        )
        new_logs.append(log)
        existing_id_set.add(tap.id)

    if new_logs:
        db.bulk_save_objects(new_logs)
        db.commit()
        # Invalidate live stats cache for this event
        stats_cache.invalidate(f"stats_{event.id}")

    return {
        "synced_count": len(new_logs),
        "already_existed_count": len(incoming_ids) - len(new_logs),
        "event_status": event.status,
        "message": f"Berhasil menyinkronkan {len(new_logs)} data kehadiran"
    }
