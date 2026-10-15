from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.database import get_db
from app.models import MasterPos, User
from app.schemas import MasterPosCreate, MasterPosUpdate, MasterPosResponse
from app.auth import require_admin, require_litbang_or_admin

router = APIRouter(prefix="/api/master-pos", tags=["Master Pos / Pintu Masuk"])

@router.get("", response_model=List[MasterPosResponse])
def get_master_pos(
    active_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_litbang_or_admin)
):
    query = db.query(MasterPos)
    if active_only:
        query = query.filter(MasterPos.is_active == True)
    return query.order_by(MasterPos.building.asc(), MasterPos.display_order.asc(), MasterPos.id.asc()).all()

@router.post("", response_model=MasterPosResponse)
def create_master_pos(
    payload: MasterPosCreate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    existing = db.query(MasterPos).filter(MasterPos.code == payload.code).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Kode pintu '{payload.code}' sudah terdaftar")

    new_pos = MasterPos(
        building=payload.building.strip() if payload.building else "Gedung Gereja Utama",
        name=payload.name,
        code=payload.code,
        description=payload.description,
        display_order=payload.display_order,
        is_active=payload.is_active
    )
    db.add(new_pos)
    db.commit()
    db.refresh(new_pos)
    return new_pos

@router.put("/{pos_id}", response_model=MasterPosResponse)
def update_master_pos(
    pos_id: int,
    payload: MasterPosUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(MasterPos).filter(MasterPos.id == pos_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Data master pintu tidak ditemukan")

    if payload.building is not None:
        target.building = payload.building.strip() or "Gedung Gereja Utama"
    if payload.name is not None:
        target.name = payload.name
    if payload.code is not None and payload.code != target.code:
        existing = db.query(MasterPos).filter(MasterPos.code == payload.code).first()
        if existing:
            raise HTTPException(status_code=400, detail=f"Kode pintu '{payload.code}' sudah ada")
        target.code = payload.code
    if payload.description is not None:
        target.description = payload.description
    if payload.display_order is not None:
        target.display_order = payload.display_order
    if payload.is_active is not None:
        target.is_active = payload.is_active

    db.commit()
    db.refresh(target)
    return target

@router.delete("/{pos_id}")
def delete_master_pos(
    pos_id: int,
    db: Session = Depends(get_db),
    admin: User = Depends(require_admin)
):
    target = db.query(MasterPos).filter(MasterPos.id == pos_id).first()
    if not target:
        raise HTTPException(status_code=404, detail="Data master pintu tidak ditemukan")

    db.delete(target)
    db.commit()
    return {"message": "Data master pintu berhasil dihapus"}
