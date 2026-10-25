import os
import sys
import uuid
from datetime import datetime, timedelta
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app, init_db_and_seed
from app.database import Base, get_db
from app.models import ChoiceCode, EventStatus

# Run in-memory or test sqlite
TEST_DATABASE_URL = "sqlite:///./test_app.db"
test_engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)
    # Run seed
    from app.models import User, UserRole, MasterPos
    from app.auth import hash_password
    db = TestingSessionLocal()
    admin = User(
        email="admin@matius.id",
        hashed_password=hash_password("AdminMatius2026!"),
        full_name="Admin IT Paroki",
        role=UserRole.ADMIN,
        is_active=True
    )
    litbang = User(
        email="litbang@matius.id",
        hashed_password=hash_password("LitbangMatius2026!"),
        full_name="Tim Litbang Paroki",
        role=UserRole.LITBANG,
        is_active=True
    )
    door = MasterPos(
        name="Pintu Barat / Utama",
        code="pintu-barat",
        description="Pintu Depan",
        display_order=1,
        is_active=True
    )
    db.add_all([admin, litbang, door])
    db.commit()
    db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists("./test_app.db"):
        os.remove("./test_app.db")

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"

def test_login_and_auth():
    # Login Litbang
    res = client.post("/api/auth/login", json={
        "email": "litbang@matius.id",
        "password": "LitbangMatius2026!"
    })
    assert res.status_code == 200
    token = res.json()["access_token"]
    assert token is not None

    # Get Me
    me_res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == "litbang@matius.id"
    assert me_res.json()["role"] == "LITBANG"

def test_create_event_and_counter_flow():
    # Login Admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@matius.id",
        "password": "AdminMatius2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Event (e.g. Misa Natal 2026)
    event_payload = {
        "name": "Misa Natal I 2026",
        "category": "Misa",
        "description": "Misa malam natal pertama",
        "start_time": (datetime.utcnow() + timedelta(hours=1)).isoformat(),
        "capacity_target": 1000,
        "enable_capacity_warning": True
    }
    create_res = client.post("/api/events", json=event_payload, headers=headers)
    assert create_res.status_code == 200
    event_data = create_res.json()
    assert event_data["name"] == "Misa Natal I 2026"
    assert len(event_data["pos_list"]) >= 1

    pos_item = event_data["pos_list"][0]
    pos_token = pos_item["token"]
    event_id = event_data["id"]

    # Validate pos token without login (Petugas Kiosk scenario)
    val_res = client.get(f"/api/counter/validate/{pos_token}")
    assert val_res.status_code == 200
    assert val_res.json()["event_name"] == "Misa Natal I 2026"

    # Simulate Petugas tapping counter offline then sync batch
    tap1_id = str(uuid.uuid4())
    tap2_id = str(uuid.uuid4())
    now_iso = datetime.utcnow().isoformat()

    # Validate Pos Access
    val_res = client.get(f"/api/counter/validate/{pos_token}")
    assert val_res.status_code == 200
    assert "building" in val_res.json()
    assert val_res.json()["building"] != ""

    batch_payload = {
        "taps": [
            {
                "id": tap1_id,
                "choice_code": "PAROKI_BINTARO",
                "client_timestamp": now_iso,
                "metadata": {"source": "tablet_pintu_1"}
            },
            {
                "id": tap2_id,
                "choice_code": "LUAR_PAROKI",
                "client_timestamp": now_iso,
                "metadata": {"source": "tablet_pintu_1"}
            }
        ]
    }
    sync_res = client.post(f"/api/counter/{pos_token}/sync", json=batch_payload)
    assert sync_res.status_code == 200
    assert sync_res.json()["synced_count"] == 2

    # Test idempotency (retry same taps should not duplicate)
    retry_res = client.post(f"/api/counter/{pos_token}/sync", json=batch_payload)
    assert retry_res.status_code == 200
    assert retry_res.json()["synced_count"] == 0
    assert retry_res.json()["already_existed_count"] == 2

    # Check Live Stats for Videotron & Panitia
    stats_res = client.get(f"/api/stats/{event_id}/live")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_umat"] == 2
    assert stats["paroki_bintaro_count"] == 1
    assert stats["luar_paroki_count"] == 1
    assert stats["paroki_bintaro_percentage"] == 50.0
    assert stats["luar_paroki_percentage"] == 50.0
    assert "building_breakdown" in stats
    assert len(stats["building_breakdown"]) > 0
    assert stats["building_breakdown"][0]["total"] == 2

    # Test CSV Export
    csv_res = client.get(f"/api/stats/{event_id}/export/csv")
    assert csv_res.status_code == 200
    assert "Gedung_Lokasi" in csv_res.text
    assert "Umat Paroki Bintaro" in csv_res.text
    assert "Umat Luar Paroki" in csv_res.text
    assert "Waktu_Sentuh_Lokal" in csv_res.text
    assert "Waktu_Diterima_Server" not in csv_res.text
    assert "Metadata_Tambahan" not in csv_res.text

    # Test CSV Export with debug info
    csv_debug_res = client.get(f"/api/stats/{event_id}/export/csv?include_debug=true")
    assert csv_debug_res.status_code == 200
    assert "Waktu_Diterima_Server" in csv_debug_res.text
    assert "Metadata_Tambahan" in csv_debug_res.text

def test_spa_fallback_and_static_serving():
    # Test root URL returns HTML
    res = client.get("/")
    assert res.status_code == 200
    assert "Statistik Kehadiran Umat" in res.text

    # Test Kiosk pos path falls back to SPA index.html
    pos_res = client.get("/pos/sample-token-abc")
    assert pos_res.status_code == 200
    assert "root" in pos_res.text

    # Test Videotron path falls back to SPA index.html
    v_res = client.get("/videotron/some-event-id")
    assert v_res.status_code == 200
    assert "root" in v_res.text

def test_master_pos_and_user_management():
    # Login as admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@matius.id",
        "password": "AdminMatius2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # List master pos
    pos_res = client.get("/api/master-pos", headers=headers)
    assert pos_res.status_code == 200
    doors = pos_res.json()
    assert len(doors) >= 1

    # Create new master door
    new_door = client.post("/api/master-pos", headers=headers, json={
        "name": "Pintu Sayap Kiri",
        "code": "pintu-sayap-kiri",
        "description": "Sayap kiri gereja",
        "display_order": 5,
        "is_active": True
    })
    assert new_door.status_code == 200
    created_id = new_door.json()["id"]

    # Delete master door
    del_res = client.delete(f"/api/master-pos/{created_id}", headers=headers)
    assert del_res.status_code == 200

def test_evaluation_notes_flow():
    # Login as Litbang
    login_res = client.post("/api/auth/login", json={
        "email": "litbang@matius.id",
        "password": "LitbangMatius2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create event
    from datetime import datetime, timezone, timedelta
    start_time = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    ev_res = client.post("/api/events", headers=headers, json={
        "name": "Misa Uji Evaluasi Litbang",
        "category": "Misa Mingguan",
        "start_time": start_time,
        "capacity_target": 800,
        "enable_capacity_warning": True
    })
    assert ev_res.status_code == 200
    ev_id = ev_res.json()["id"]

    # Save evaluation notes
    notes_payload = {
        "observations": [
            {"category": "Tata Ruang", "note": "Kerapian bangku sangat baik."},
            {"category": "Audio - Visual", "note": "Mikrofon dan layar proyektor jernih."}
        ],
        "recommendations": "Pertahankan kesiapan talaks.",
        "conclusion": "Misa berjalan lancar dan tertib."
    }
    save_res = client.put(f"/api/events/{ev_id}/evaluation-notes", headers=headers, json=notes_payload)
    assert save_res.status_code == 200
    assert "Catatan evaluasi berhasil disimpan" in save_res.json()["message"]

    # Verify via live stats
    stats_res = client.get(f"/api/stats/{ev_id}/live")
    assert stats_res.status_code == 200
    stats_data = stats_res.json()
    assert stats_data["evaluation_notes"] is not None
    import json
    parsed = json.loads(stats_data["evaluation_notes"])
    assert len(parsed["observations"]) == 2
    assert parsed["observations"][0]["category"] == "Tata Ruang"
    assert parsed["recommendations"] == "Pertahankan kesiapan talaks."

def test_area_capacities_and_warning_thresholds():
    # Login Admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@matius.id",
        "password": "AdminMatius2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Ensure master pos for GKP exists
    door_res = client.post("/api/master-pos", headers=headers, json={
        "building": "GKP (Gedung Karya Pastoral)",
        "name": "Pintu Utama GKP",
        "code": f"pintu-gkp-{uuid.uuid4().hex[:6]}",
        "description": "Pintu masuk aula GKP",
        "display_order": 20,
        "is_active": True
    })
    assert door_res.status_code == 200
    gkp_door_id = door_res.json()["id"]

    # Get master pos list to find main church door ID
    all_doors = client.get("/api/master-pos", headers=headers).json()
    church_door = next((d for d in all_doors if d.get("building") == "Gedung Gereja Utama" or "Barat" in d.get("name", "")), all_doors[0])
    church_door_id = church_door["id"]

    # Create Event with area capacities
    now_iso = datetime.utcnow().isoformat()
    ev_payload = {
        "name": "Misa Paskah 2026 Multi Area",
        "category": "Misa",
        "start_time": (datetime.utcnow() + timedelta(hours=2)).isoformat(),
        "enable_capacity_warning": True,
        "area_capacities": {
            church_door.get("building") or "Gedung Gereja Utama": 10,
            "GKP (Gedung Karya Pastoral)": 5
        },
        "selected_master_pos_ids": [church_door_id, gkp_door_id]
    }
    create_res = client.post("/api/events", json=ev_payload, headers=headers)
    assert create_res.status_code == 200
    ev_data = create_res.json()
    ev_id = ev_data["id"]
    assert ev_data["capacity_target"] == 15
    assert ev_data["area_capacities"] == {
        church_door.get("building") or "Gedung Gereja Utama": 10,
        "GKP (Gedung Karya Pastoral)": 5
    }

    # Map door tokens
    pos_map = {p["building"]: p["token"] for p in ev_data["pos_list"]}
    church_token = pos_map[church_door.get("building") or "Gedung Gereja Utama"]
    gkp_token = pos_map["GKP (Gedung Karya Pastoral)"]

    # Tap 8 times into church door (8/10 = 80% => WARNING)
    church_taps = [
        {"id": str(uuid.uuid4()), "choice_code": "PAROKI_BINTARO", "client_timestamp": now_iso}
        for _ in range(8)
    ]
    sync_res = client.post(f"/api/counter/{church_token}/sync", json={"taps": church_taps})
    assert sync_res.status_code == 200

    # Tap 1 time into GKP door (1/5 = 20% => NORMAL)
    gkp_taps = [
        {"id": str(uuid.uuid4()), "choice_code": "LUAR_PAROKI", "client_timestamp": now_iso}
    ]
    sync_res = client.post(f"/api/counter/{gkp_token}/sync", json={"taps": gkp_taps})
    assert sync_res.status_code == 200

    # Check Live Stats
    stats_res = client.get(f"/api/stats/{ev_id}/live")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_umat"] == 9
    assert stats["capacity_target"] == 15
    assert stats["capacity_percentage"] == 60.0
    # Because Church building is at 80% (>= 75%), overall capacity_status should be WARNING!
    assert stats["capacity_status"] == "WARNING"

    # Verify per-building breakdown
    bld_map = {b["building"]: b for b in stats["building_breakdown"]}
    bld_church = bld_map[church_door.get("building") or "Gedung Gereja Utama"]
    assert bld_church["capacity_target"] == 10
    assert bld_church["capacity_percentage"] == 80.0
    assert bld_church["capacity_status"] == "WARNING"

    bld_gkp = bld_map["GKP (Gedung Karya Pastoral)"]
    assert bld_gkp["capacity_target"] == 5
    assert bld_gkp["capacity_percentage"] == 20.0
    assert bld_gkp["capacity_status"] == "NORMAL"

    # Now add 2 more taps to church door (10/10 = 100% => FULL)
    more_church_taps = [
        {"id": str(uuid.uuid4()), "choice_code": "PAROKI_BINTARO", "client_timestamp": now_iso}
        for _ in range(2)
    ]
    sync_res = client.post(f"/api/counter/{church_token}/sync", json={"taps": more_church_taps})
    assert sync_res.status_code == 200

    # Check Live Stats again
    stats_res = client.get(f"/api/stats/{ev_id}/live")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["total_umat"] == 11
    # Now Church building is at 100% (>= 95%), overall capacity_status should be FULL!
    assert stats["capacity_status"] == "FULL"
    bld_map = {b["building"]: b for b in stats["building_breakdown"]}
    assert bld_map[church_door.get("building") or "Gedung Gereja Utama"]["capacity_status"] == "FULL"


def test_wib_timezone_conversion():
    # Login Admin
    login_res = client.post("/api/auth/login", json={
        "email": "admin@matius.id",
        "password": "AdminMatius2026!"
    })
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create Event with UTC timestamp 2026-12-24T10:00:00Z (= 17:00:00 WIB)
    ev_res = client.post("/api/events", headers=headers, json={
        "name": "Misa Uji WIB",
        "category": "Misa",
        "start_time": "2026-12-24T10:00:00Z",
        "capacity_target": 500,
        "enable_capacity_warning": False
    })
    assert ev_res.status_code == 200
    ev_data = ev_res.json()
    ev_id = ev_data["id"]
    pos_token = ev_data["pos_list"][0]["token"]

    # Returned start_time must be serialized in Asia/Jakarta (+07:00) -> 17:00:00+07:00
    assert ev_data["start_time"].startswith("2026-12-24T17:00:00")
    assert "+07:00" in ev_data["start_time"]

    # Sync a tap with UTC timestamp 2026-12-24T09:32:15Z (= 16:32:15 WIB -> 16:30 bucket)
    tap_id = str(uuid.uuid4())
    sync_res = client.post(f"/api/counter/{pos_token}/sync", json={
        "taps": [
            {
                "id": tap_id,
                "choice_code": "PAROKI_BINTARO",
                "client_timestamp": "2026-12-24T09:32:15Z"
            }
        ]
    })
    assert sync_res.status_code == 200

    # Verify DB still stores naive UTC timestamp (existing DB convention preserved)
    from app.models import AttendanceLog
    db = TestingSessionLocal()
    tap_row = db.query(AttendanceLog).filter(AttendanceLog.id == tap_id).first()
    assert tap_row is not None
    assert tap_row.client_timestamp.hour == 9
    assert tap_row.client_timestamp.minute == 32
    db.close()

    # Verify Live Stats buckets in WIB (16:30) and returns +07:00 timestamps
    stats_res = client.get(f"/api/stats/{ev_id}/live")
    assert stats_res.status_code == 200
    stats = stats_res.json()
    assert stats["start_time"].startswith("2026-12-24T17:00:00")
    assert "+07:00" in stats["start_time"]
    assert "+07:00" in stats["last_updated"]
    assert len(stats["time_series"]) == 1
    assert stats["time_series"][0]["time_label"] == "16:30"
    assert stats["time_series"][0]["total"] == 1

    # Verify CSV export converts timestamp to WIB (16:32:15)
    csv_res = client.get(f"/api/stats/{ev_id}/export/csv")
    assert csv_res.status_code == 200
    assert "2026-12-24 16:32:15" in csv_res.text


