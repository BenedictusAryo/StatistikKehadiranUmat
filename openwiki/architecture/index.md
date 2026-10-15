# Files

- [Authentication & Role-Based Access Control](authentication.md) - OpenWiki uses JWT-based authentication with bcrypt password hashing and a dual-role RBAC model (ADMIN, LITBANG). The backend issues tokens containing email and role claims; the frontend persists them in Zustand/localStorage and attaches them as Bearer tokens. User CRUD is restricted to ADMIN. Seed users are created at startup from .env configuration via init_db_and_seed().

- [Backend Overview](backend-overview.md) - High-level architecture of the FastAPI backend serving the Gereja St. Matius Penginjil Paroki Bintaro congregation attendance counter: lifespan seeding, CORS middleware, five API routers, in-memory TTL cache, offline-first batch sync endpoint, SPA fallback serving, and dependency injection wiring.
- [Data Model](data-model.md) - SQLAlchemy ORM entity model for the Gereja St. Matius Penginjil Paroki Bintaro congregation attendance counter: User (RBAC), MasterPos (default door catalog), EventSession (mass event), EventPos (per-event door instance with token), AttendanceLog (tap record). Includes relationships, constraint rules, cascade delete behavior, and key query patterns.
