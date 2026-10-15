import uuid
import random
import json
from datetime import datetime, timedelta
from app.database import SessionLocal
from app.models import EventSession, EventPos, AttendanceLog, EventStatus, ChoiceCode, MasterPos

def create_demo_data():
    db = SessionLocal()
    try:
        # Check if an existing demo event with same code exists
        existing = db.query(EventSession).filter(EventSession.name.like("%Demo Live%")).first()
        if existing:
            print(f"Removing old demo event: {existing.id} - {existing.name}")
            db.delete(existing)
            db.commit()

        # Generate Demo Event
        event_id = str(uuid.uuid4())
        now = datetime.utcnow()
        start_time = now - timedelta(minutes=45)
        end_time = now + timedelta(hours=2)

        demo_notes = {
            "observations": [
                {"category": "Tata Ruang", "note": "Kapasitas bangku gereja utama terisi tertib, selasar mulai dialirkan ke kursi cadangan."},
                {"category": "Tata Laksana", "note": "Petugas tatib sigap memandu umat luar paroki dan lansia ke bangku sayap barat."},
                {"category": "Audio - Visual", "note": "Visual proyektor dan videotron luar terpantau jernih dengan latency rendah."}
            ],
            "recommendations": "Pertahankan koordinasi antar pos gerbang barat dan timur untuk mencegah penumpukan di pintu masuk utama menjelang doa pembuka.",
            "conclusion": "Simulasi misa berjalan sangat lancar, pembagian umat paroki dan tamu peziarah terdata akurat."
        }

        event = EventSession(
            id=event_id,
            name="Misa Hari Minggu Biasa XXVIII (Demo Live)",
            category="Misa",
            description="Misa mingguan dengan live counter pos jaga gereja utama, GKP, dan tenda selasar.",
            start_time=start_time,
            end_time=end_time,
            status=EventStatus.OPEN,
            capacity_target=850,
            enable_capacity_warning=True,
            evaluation_notes=json.dumps(demo_notes)
        )
        db.add(event)
        db.flush()

        # Preset Doors
        doors_data = [
            ("Gedung Gereja Utama", "Pintu Utama / Barat", "pintu-barat", "demo-pintu-barat"),
            ("Gedung Gereja Utama", "Pintu Timur", "pintu-timur", "demo-pintu-timur"),
            ("Gedung Gereja Utama", "Pintu Utara", "pintu-utara", "demo-pintu-utara"),
            ("Gedung Gereja Utama", "Pintu Balkon", "pintu-balkon", "demo-pintu-balkon"),
            ("Gedung Karya Pastoral (GKP)", "GKP - Auditorium Lt. 2", "gkp-auditorium", "demo-gkp-auditorium"),
            ("Gedung Karya Pastoral (GKP)", "GKP - Ruang Serbaguna Lt. 1", "gkp-serbaguna", "demo-gkp-serbaguna"),
            ("Tenda & Selasar Luar", "Tenda Selasar / Plaza Depan", "tenda-plaza", "demo-tenda-plaza"),
        ]

        pos_instances = []
        for bld, name, code, token in doors_data:
            pos = EventPos(
                id=str(uuid.uuid4()),
                event_id=event_id,
                building=bld,
                name=name,
                code=code,
                token=token,
                is_active=True
            )
            db.add(pos)
            pos_instances.append(pos)
        
        db.flush()

        # Seed realistic arrival taps distributed over past 45 minutes
        # Weights: Pintu Barat has highest flow, followed by Timur, Utara, then Tenda & GKP
        door_weights = [0.38, 0.22, 0.15, 0.08, 0.07, 0.04, 0.06]
        total_sample_taps = 428

        logs = []
        for _ in range(total_sample_taps):
            chosen_pos = random.choices(pos_instances, weights=door_weights)[0]
            # Time curve: peaked 15-30 minutes ago
            minutes_ago = random.triangular(0, 45, 22)
            log_time = now - timedelta(minutes=minutes_ago)

            # Choice: ~73% Paroki Bintaro, 27% Luar Paroki
            choice = ChoiceCode.PAROKI_BINTARO if random.random() < 0.73 else ChoiceCode.LUAR_PAROKI

            log = AttendanceLog(
                id=str(uuid.uuid4()),
                event_id=event_id,
                pos_id=chosen_pos.id,
                choice_code=choice,
                client_timestamp=log_time,
                server_timestamp=log_time + timedelta(milliseconds=random.randint(50, 400)),
                metadata_json=json.dumps({"source": "demo_seed"})
            )
            logs.append(log)

        db.bulk_save_objects(logs)
        db.commit()

        print(f"SUCCESS: Created demo event '{event.name}' (ID: {event_id})")
        print(f"Total Taps Seeded: {total_sample_taps}")
        print(f"Kiosk Door Links:")
        for p in pos_instances:
            print(f"  - {p.name} ({p.building}): http://localhost:8000/pos/{p.token}")
        print(f"\nLive Event Dashboard: http://localhost:8000/events/{event_id}")
        print(f"Videotron Display: http://localhost:8000/videotron/{event_id}")
        print(f"Print Report: http://localhost:8000/events/{event_id}/report")

    finally:
        db.close()

if __name__ == "__main__":
    create_demo_data()
