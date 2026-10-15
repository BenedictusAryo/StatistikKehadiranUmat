import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse

from app.config import settings
from app.database import engine, Base, SessionLocal
from app.models import User, UserRole, MasterPos
from app.auth import hash_password
from app.routers import auth, master_pos, misa, counter, stats

def init_db_and_seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Seed Initial Admin (Tim IT)
        admin = db.query(User).filter(User.email == settings.INITIAL_ADMIN_EMAIL).first()
        if not admin:
            admin = User(
                email=settings.INITIAL_ADMIN_EMAIL,
                hashed_password=hash_password(settings.INITIAL_ADMIN_PASSWORD),
                full_name="Admin IT Paroki",
                role=UserRole.ADMIN,
                is_active=True
            )
            db.add(admin)

        # Seed Initial Litbang
        litbang = db.query(User).filter(User.email == settings.INITIAL_LITBANG_EMAIL).first()
        if not litbang:
            litbang = User(
                email=settings.INITIAL_LITBANG_EMAIL,
                hashed_password=hash_password(settings.INITIAL_LITBANG_PASSWORD),
                full_name="Tim Litbang Paroki",
                role=UserRole.LITBANG,
                is_active=True
            )
            db.add(litbang)

        # Seed Master Pos Defaults (Pintu Masuk Paroki Bintaro with Gedung Hierarchy)
        default_doors = [
            ("Gedung Gereja Utama", "Pintu Utama / Barat", "pintu-barat", "Pintu gerbang depan gereja", 1),
            ("Gedung Gereja Utama", "Pintu Timur", "pintu-timur", "Pintu samping arah pastoran", 2),
            ("Gedung Gereja Utama", "Pintu Utara", "pintu-utara", "Pintu samping utara", 3),
            ("Gedung Gereja Utama", "Pintu Balkon", "pintu-balkon", "Pintu tangga balkon atas", 4),
            ("Gedung Karya Pastoral (GKP)", "GKP - Auditorium Lt. 2", "gkp-auditorium", "Ruang auditorium lantai 2 GKP", 5),
            ("Gedung Karya Pastoral (GKP)", "GKP - Ruang Serbaguna Lt. 1", "gkp-serbaguna", "Ruang serbaguna lantai 1 GKP", 6),
            ("Tenda & Selasar Luar", "Tenda Selasar / Plaza Depan", "tenda-plaza", "Area tenda tambahan di luar gereja", 7),
        ]
        for bld, name, code, desc, order in default_doors:
            existing_door = db.query(MasterPos).filter(MasterPos.code == code).first()
            if not existing_door:
                door = MasterPos(
                    building=bld,
                    name=name,
                    code=code,
                    description=desc,
                    display_order=order,
                    is_active=True
                )
                db.add(door)
            elif not existing_door.building or existing_door.building == "":
                existing_door.building = bld

        db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db_and_seed()
    yield
    # Shutdown

app = FastAPI(
    title=settings.APP_NAME,
    description="Aplikasi Statistik Real-Time & Counter Kehadiran Umat Gereja St. Matius Penginjil Paroki Bintaro",
    version="1.0.0",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(master_pos.router)
app.include_router(misa.router)
app.include_router(counter.router)
app.include_router(stats.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "app_name": settings.APP_NAME,
        "parish": settings.PARISH_NAME
    }

# Static Files & SPA Fallback serving
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    assets_dir = os.path.join(static_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str, request: Request):
        # If API route, don't catch here (handled above)
        if full_path.startswith("api/"):
            return JSONResponse(status_code=404, content={"detail": "API endpoint not found"})

        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        index_file = os.path.join(static_dir, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

        return JSONResponse(
            status_code=200,
            content={"message": f"Welcome to {settings.APP_NAME}. Frontend build not found yet in app/static."}
        )
