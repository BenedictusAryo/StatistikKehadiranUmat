import io
import csv
import json
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Dict, Any, Optional, List

from app.database import get_db
from app.models import (
    EventSession, EventPos, AttendanceLog, ChoiceCode, EventStatus
)
from app.schemas import LiveStatsResponse, PosStatItem, TimeSeriesBucket, BuildingStatItem
from app.cache import stats_cache
from app.config import settings

router = APIRouter(prefix="/api/stats", tags=["Realtime Stats & Reports"])

@router.get("/{event_id}/live", response_model=LiveStatsResponse)
def get_live_stats(event_id: str, db: Session = Depends(get_db)):
    # Check cache first
    cache_key = f"stats_{event_id}"
    cached = stats_cache.get(cache_key)
    if cached:
        return cached

    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    # Overall totals
    total_logs = db.query(AttendanceLog).filter(AttendanceLog.event_id == event_id).all()
    total_umat = len(total_logs)

    paroki_bintaro_count = sum(1 for log in total_logs if log.choice_code == ChoiceCode.PAROKI_BINTARO)
    luar_paroki_count = sum(1 for log in total_logs if log.choice_code == ChoiceCode.LUAR_PAROKI)

    pb_pct = round((paroki_bintaro_count / total_umat * 100), 1) if total_umat > 0 else 0.0
    lp_pct = round((luar_paroki_count / total_umat * 100), 1) if total_umat > 0 else 0.0

    # Parse area capacities if present
    area_caps: Optional[Dict[str, int]] = None
    if event.area_capacities:
        try:
            if isinstance(event.area_capacities, str):
                area_caps = json.loads(event.area_capacities)
            elif isinstance(event.area_capacities, dict):
                area_caps = event.area_capacities
        except Exception:
            area_caps = None

    # Pos breakdown
    pos_items = []
    for pos in event.pos_list:
        pos_logs = [log for log in total_logs if log.pos_id == pos.id]
        p_total = len(pos_logs)
        p_pb = sum(1 for log in pos_logs if log.choice_code == ChoiceCode.PAROKI_BINTARO)
        p_lp = sum(1 for log in pos_logs if log.choice_code == ChoiceCode.LUAR_PAROKI)
        pos_items.append(PosStatItem(
            pos_id=pos.id,
            building=getattr(pos, "building", "Gedung Gereja Utama") or "Gedung Gereja Utama",
            pos_name=pos.name,
            total=p_total,
            paroki_bintaro=p_pb,
            luar_paroki=p_lp
        ))

    # Building breakdown
    building_map: Dict[str, Dict[str, int]] = {}
    for item in pos_items:
        b = item.building
        if b not in building_map:
            building_map[b] = {"total": 0, "pb": 0, "lp": 0, "pos_count": 0}
        building_map[b]["total"] += item.total
        building_map[b]["pb"] += item.paroki_bintaro
        building_map[b]["lp"] += item.luar_paroki
        building_map[b]["pos_count"] += 1

    building_breakdown = []
    for b_name, vals in building_map.items():
        b_cap_target = None
        if event.enable_capacity_warning:
            if area_caps and b_name in area_caps:
                b_cap_target = area_caps[b_name]
            elif len(building_map) == 1 and event.capacity_target:
                b_cap_target = event.capacity_target

        b_cap_pct = None
        b_cap_status = "NORMAL"
        if b_cap_target and b_cap_target > 0:
            b_cap_pct = round((vals["total"] / b_cap_target * 100), 1)
            if b_cap_pct >= 95.0:
                b_cap_status = "FULL"
            elif b_cap_pct >= 75.0:
                b_cap_status = "WARNING"
            else:
                b_cap_status = "NORMAL"

        building_breakdown.append(BuildingStatItem(
            building=b_name,
            total=vals["total"],
            paroki_bintaro=vals["pb"],
            luar_paroki=vals["lp"],
            pos_count=vals["pos_count"],
            capacity_target=b_cap_target,
            capacity_percentage=b_cap_pct,
            capacity_status=b_cap_status
        ))

    # Overall capacity target and status
    total_cap = None
    if area_caps:
        total_cap = sum(area_caps.values())
    elif event.capacity_target:
        total_cap = event.capacity_target

    cap_pct = None
    cap_status = "NORMAL"
    if event.enable_capacity_warning and total_cap and total_cap > 0:
        overall_cap_pct = round((total_umat / total_cap * 100), 1)
        any_full = any(b.capacity_status == "FULL" for b in building_breakdown)
        any_warning = any(b.capacity_status == "WARNING" for b in building_breakdown)
        if any_full or overall_cap_pct >= 95.0:
            cap_status = "FULL"
        elif any_warning or overall_cap_pct >= 75.0:
            cap_status = "WARNING"
        else:
            cap_status = "NORMAL"
        cap_pct = overall_cap_pct

    # Time series aggregation (5-minute buckets based on client_timestamp)
    # Group logs by bucket
    buckets_map: Dict[str, Dict[str, int]] = {}
    
    # Sort logs by client_timestamp
    sorted_logs = sorted(total_logs, key=lambda x: x.client_timestamp)
    for log in sorted_logs:
        # Round to nearest 5 mins (e.g. HH:MM)
        ct = log.client_timestamp
        minute_bucket = (ct.minute // 5) * 5
        time_key = f"{ct.hour:02d}:{minute_bucket:02d}"
        if time_key not in buckets_map:
            buckets_map[time_key] = {"total": 0, "pb": 0, "lp": 0}
        buckets_map[time_key]["total"] += 1
        if log.choice_code == ChoiceCode.PAROKI_BINTARO:
            buckets_map[time_key]["pb"] += 1
        elif log.choice_code == ChoiceCode.LUAR_PAROKI:
            buckets_map[time_key]["lp"] += 1

    time_series = [
        TimeSeriesBucket(
            time_label=k,
            total=v["total"],
            paroki_bintaro=v["pb"],
            luar_paroki=v["lp"]
        )
        for k, v in buckets_map.items()
    ]

    result = LiveStatsResponse(
        event_id=event.id,
        event_name=event.name,
        category=event.category,
        status=event.status,
        start_time=event.start_time,
        capacity_target=total_cap,
        enable_capacity_warning=event.enable_capacity_warning,
        area_capacities=area_caps,
        total_umat=total_umat,
        paroki_bintaro_count=paroki_bintaro_count,
        luar_paroki_count=luar_paroki_count,
        paroki_bintaro_percentage=pb_pct,
        luar_paroki_percentage=lp_pct,
        capacity_percentage=cap_pct,
        capacity_status=cap_status,
        building_breakdown=building_breakdown,
        pos_breakdown=pos_items,
        time_series=time_series,
        evaluation_notes=event.evaluation_notes,
        last_updated=datetime.utcnow()
    )

    # Store in TTL Cache
    stats_cache.set(cache_key, result, ttl=settings.CACHE_TTL_SECONDS)
    return result

@router.get("/{event_id}/export/csv")
def export_csv(
    event_id: str,
    include_debug: bool = False,
    db: Session = Depends(get_db)
):
    event = db.query(EventSession).filter(EventSession.id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event tidak ditemukan")

    pos_dict = {p.id: p for p in event.pos_list}
    logs = (
        db.query(AttendanceLog)
        .filter(AttendanceLog.event_id == event_id)
        .order_by(AttendanceLog.client_timestamp.asc())
        .all()
    )

    output = io.StringIO()
    writer = csv.writer(output)

    # Write header
    if include_debug:
        writer.writerow([
            "ID_Tap",
            "Nama_Event",
            "Gedung_Lokasi",
            "Nama_Pos_Pintu",
            "Pilihan_Umat",
            "Waktu_Sentuh_Lokal",
            "Waktu_Diterima_Server",
            "Metadata_Tambahan"
        ])
    else:
        writer.writerow([
            "ID_Tap",
            "Nama_Event",
            "Gedung_Lokasi",
            "Nama_Pos_Pintu",
            "Pilihan_Umat",
            "Waktu_Sentuh_Lokal"
        ])

    for log in logs:
        p = pos_dict.get(log.pos_id)
        b_name = p.building if p else "Gedung Gereja Utama"
        p_name = p.name if p else "Pos Tidak Diketahui"
        choice_label = "Umat Paroki Bintaro" if log.choice_code == ChoiceCode.PAROKI_BINTARO else "Umat Luar Paroki"
        
        row = [
            log.id,
            event.name,
            b_name,
            p_name,
            choice_label,
            log.client_timestamp.strftime("%Y-%m-%d %H:%M:%S")
        ]
        if include_debug:
            row.extend([
                log.server_timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                log.metadata_json or ""
            ])
        writer.writerow(row)

    csv_content = output.getvalue()
    filename = f"statistik_kehadiran_{event.name.lower().replace(' ', '_')}.csv"

    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )
