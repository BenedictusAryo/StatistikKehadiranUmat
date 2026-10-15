---
type: operations guide
title: cPanel Deployment (Phusion Passenger + MySQL)
description: End-to-end deployment procedure for the attendance-statistics app on cPanel shared hosting using Phusion Passenger (passenger_wsgi.py + a2wsgi bridge), MySQL via pymysql, Alembic migrations, static frontend build serving, environment configuration, and restart lifecycle.
tags:
- deployment
- cpanel
- passenger
- a2wsgi
- mysql
- alembic
- shared-hosting
- wsgi
verified:
  - by: openwiki/0.5.1
    at: 2026-10-04T04:05:02.987Z
sources:
  - id: openwiki-source-267851376b2890357860d983
    resource: repo://alembic/env.py
  - id: openwiki-source-27968b0140d9f4dbf73030e5
    resource: repo://app/config.py
  - id: openwiki-source-2b476936a0094b7cba0a63fe
    resource: repo://app/database.py
  - id: openwiki-source-21c0a295e6c6f5529dc70d5f
    resource: repo://app/main.py
  - id: openwiki-source-1047363cf615000e4c9bb694
    resource: repo://frontend/package.json
  - id: openwiki-source-2cb33ec40dcf15f282061754
    resource: repo://passenger_wsgi.py
  - id: openwiki-source-23775c3de52f3ab95a13cb8b
    resource: repo://README.md
  - id: openwiki-source-373640cd8a0886cee69db282
    resource: repo://requirements.txt
generated: { by: "openwiki/0.5.1", at: "2026-10-04T04:05:02.987Z" }
---

# cPanel Deployment

This page documents the full deployment procedure for the attendance-statistics application (FastAPI backend + React SPA frontend) onto **cPanel shared hosting** running **Phusion Passenger** (the `Setup Python App` feature). The production target serves Gereja St. Matius Penginjil Paroki Bintaro.

---

## Architecture Overview

cPanel shared hosting does not natively run ASGI (FastAPI) applications. A WSGI adaption layer bridges the two:

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
flowchart LR
    subgraph Client
        Browser
    end

    subgraph cPanel
        direction TB
        Passenger["Phusion Passenger<br/>(WSGI container)"]
        WSGI["passenger_wsgi.py<br/>(WSGI entrypoint)"]
        A2WSGI["a2wsgi.ASGIMiddleware<br/>(WSGI→ASGI bridge)"]
        FastAPI["FastAPI app<br/>(app.main:app)"]
        Static["app/static/<br/>(React SPA build)"]
        DB["MySQL Database<br/>(pymysql)"]
    end

    Browser -->|HTTP| Passenger
    Passenger --> WSGI
    WSGI --> A2WSGI
    A2WSGI --> FastAPI
    FastAPI --> Static
    FastAPI --> DB
```

**Key components:**

| Role | File / Package | Responsibility |
|------|---------------|---------------|
| WSGI entrypoint | `/passenger_wsgi.py` | Inserts project root into `sys.path`, wraps the ASGI FastAPI app via `a2wsgi.ASGIMiddleware` |
| ASGI bridge | `a2wsgi` (in `requirements.txt`) | Converts WSGI environ into an ASGI scope so FastAPI can run under Passenger |
| Database driver | `pymysql` (in `requirements.txt`) | Pure-Python MySQL client used by SQLAlchemy for the production `DATABASE_URL` |
| Frontend static | `app/static/` | Built React SPA (Vite output); served by FastAPI's `StaticFiles` mount + SPA fallback route |

---

## Prerequisites

- **cPanel** with the following features enabled:
  - **Setup Python App** (Phusion Passenger)
  - **MySQL Databases**
  - **File Manager** or FTP/SFTP access
  - **Terminal** (for `pip install` and `alembic`)
- **Local build environment** (developer machine): Python 3.10+, Node.js 18+ with npm, Git.
- The project repository cloned locally and passing `pytest tests/`.

---

## Step 1: Create the MySQL Database

1. In cPanel, open **MySQL Databases**.
2. Create a new database (e.g., `paroki_statistik`).
3. Create a database user with a strong password.
4. Assign **ALL PRIVILEGES** on the new database to the user.

Record the database name, username, and password. On cPanel shared hosting the host is almost always `localhost`.

---

## Step 2: Configure the Python App in cPanel

1. Open **Setup Python App** in cPanel.
2. Click **Create Application** and fill in:

   | Field | Value | Notes |
   |-------|-------|-------|
   | Python version | `3.10` (or newer available) | Meets the project's 3.10+ requirement |
   | Application root | `statistik_umat` (or any subdirectory) | Relative to the account home directory |
   | Application URL | `statistik.matius.id` or a parish subdirectory | The public URL |
   | Application startup file | `passenger_wsgi.py` | Must exist at the application root |
   | Application Entry point | `application` | The WSGI callable name defined in `passenger_wsgi.py` |

3. cPanel shows the **virtual environment path** (needed in Step 4) and writes the Passenger/`.htaccess` configuration automatically.

---

## Step 3: Upload Project Files

Upload the whole project into the **Application root**, excluding:

- `.venv/` — local virtual environment (cPanel creates its own)
- `frontend/node_modules/` — build-time Node dependencies
- `__pycache__/` directories
- `.git/` (optional)

**Critical:** upload the *built* frontend. Build locally before uploading:

```bash
cd frontend
npm install
npm run build
cd ..
```

The Vite production build emits the SPA (HTML, JS, CSS) directly into `app/static/`, and that directory must be part of the upload.

---

## Step 4: Install Python Dependencies

In the cPanel **Terminal**, activate the virtual environment created in Step 2 (path shown on the Setup Python App page), then install:

```bash
source /home/<user>/virtualenv/statistik_umat/3.10/bin/activate
cd ~/statistik_umat
pip install -r requirements.txt
```

The two packages that make cPanel production work are:

| Package | Why it matters |
|---------|----------------|
| `a2wsgi>=1.10.0` | The WSGI→ASGI bridge required by `passenger_wsgi.py` |
| `pymysql>=1.1.0` | The MySQL driver named in the production `DATABASE_URL` |

The remainder (`fastapi`, `uvicorn[standard]`, `sqlalchemy`, `alembic`, `pydantic`, `pydantic-settings`, `email-validator`, `pyjwt`, `bcrypt`, `python-multipart`, `cryptography`, `python-dotenv`, `httpx`, `pytest`) covers the framework, auth, and test tooling.

---

## Step 5: Configure Environment Variables

Create (or edit) `.env` at the application root via File Manager or terminal:

```env
# Production MySQL database (replace with your values)
DATABASE_URL=mysql+pymysql://db_user:db_password@localhost:3306/paroki_statistik?charset=utf8mb4

# Security: replace in production
SECRET_KEY=st-matius-bintaro-secret-key-change-in-production-2026!
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Initial admin seed credentials
INITIAL_ADMIN_EMAIL=admin@matius.id
INITIAL_ADMIN_PASSWORD=AdminMatius2026!
INITIAL_LITBANG_EMAIL=litbang@matius.id
INITIAL_LITBANG_PASSWORD=LitbangMatius2026!

# App metadata
APP_NAME=Statistik Kehadiran Umat - Paroki Bintaro
PARISH_NAME=Gereja St. Matius Penginjil Paroki Bintaro
CACHE_TTL_SECONDS=3
```

`app/config.py` loads `.env` automatically through `SettingsConfigDict(env_file=".env", extra="allow")`.

> **Security:** The `.env.example` values are development throwaways. Rotate `SECRET_KEY` and the two seed passwords before going live, and change the seeded passwords after first login.

---

## Step 6: Run Database Migrations

With the virtual environment active and `.env` in place:

```bash
cd ~/statistik_umat
alembic upgrade head
```

`/alembic/env.py` overrides Alembic's `sqlalchemy.url` with `settings.DATABASE_URL` (read from `.env`) and targets `app.database.Base.metadata`, so migrations always run against the configured MySQL database. The committed revisions are:

| Revision | Description |
|----------|-------------|
| `e5a424868b5c` | Initial schema (`event_sessions`, `master_pos`, `users`, `event_pos`, `attendance_logs`) |
| `e4039a3350a7` | Adds evaluation notes to `event_session` |
| `cd05de9ff18d` | Adds building hierarchy to `master_pos` |

---

## Step 7: Restart the Application

1. Return to **Setup Python App** in cPanel.
2. Click **Restart** for the application.
3. Passenger reloads the WSGI process with the new environment, schema, and code.

---

## Step 8: Verify the Deployment

Visit the public URL (e.g., `https://statistik.matius.id`) and confirm:

- The SPA loads and routes work (client-side routing falls back to `index.html`)
- `/api/health` returns `{"status": "ok", ...}`
- Login with the seeded admin credentials works
- Event creation, kiosk counter sync, and videotron pages function
- Swagger docs are reachable at `/docs`

---

## Lifecycle and Restart Procedures

Passenger manages the worker process lifecycle; the operator restarts manually through the cPanel UI.

| Scenario | Action |
|----------|--------|
| `.env` changed | Restart via cPanel |
| New code uploaded | Restart via cPanel |
| `alembic upgrade head` run | Restart (schema was created while the app was offline) |
| Crash or hung process | Restart via cPanel |

**Startup seed behavior:** the FastAPI `lifespan` handler calls `init_db_and_seed()` at every startup. It runs `Base.metadata.create_all(bind=engine)` and then idempotently seeds the ADMIN user, the LITBANG user, and the seven default master doors (also back-filling missing `building` values on pre-existing doors). Because every insert is guarded by an existence query, the function is safe to run repeatedly.

---

## WSGI Entrypoint Mechanics

`/passenger_wsgi.py` is the contract between Phusion Passenger and the FastAPI application:

```python
import sys
import os

# Add application directory to sys.path
sys.path.insert(0, os.path.dirname(__file__))

from a2wsgi import ASGIMiddleware
from app.main import app

# Passenger WSGI callable
application = ASGIMiddleware(app)
```

It (1) places the project root on `sys.path` so `app` is importable, (2) imports the FastAPI instance from `app.main`, and (3) wraps it with `ASGIMiddleware`, producing the `application` callable named in the cPanel **Application Entry point** field. A missing `passenger_wsgi.py` at the root, or a missing `a2wsgi` install, surfaces as a 500 or `ModuleNotFoundError`.

---

## Environment Configuration

`app/config.py` defines a Pydantic `BaseSettings` subclass with defaults for every variable. Resolution order:

1. Real environment variables (highest priority)
2. `.env` file (loaded via `env_file=".env"`)
3. Class-default values (lowest priority)

**Environment switch:** the single difference between dev and production is `DATABASE_URL`:

| Environment | Value |
|-------------|-------|
| Local development | `sqlite:///./statistik_umat.db` |
| cPanel production | `mysql+pymysql://db_user:db_password@localhost:3306/paroki_statistik?charset=utf8mb4` |

`app/database.py` adapts automatically: it adds `check_same_thread=False` to the SQLAlchemy connect args only for SQLite, and sets `pool_pre_ping=True` for all engines (useful over long-lived MySQL connections on shared hosting).

---

## Static Frontend Serving

`app/main.py` serves the React build from `app/static/`:

- `/assets/` is mounted via `StaticFiles` when the `app/static/assets` directory exists.
- A catch-all `GET /{full_path:path}` route returns real files when present, otherwise `app/static/index.html` for client-side routing, and returns 404 JSON for unknown `api/…` paths.
- If no build exists at startup, requests receive a JSON welcome message instead of an error, so a missing frontend build degrades gracefully rather than crashing Passenger.

Because the SPA serves `/assets/*` hashed files, every frontend deploy should re-upload the rebuilt static directory and restart the app.

---

## Database Initialization and Seed Data

`init_db_and_seed()` in `app/main.py` runs at every application startup:

1. **Create tables** — `Base.metadata.create_all(bind=engine)`; creates missing tables and never alters existing ones.
2. **Seed ADMIN** — `admin@matius.id` (role `ADMIN`, from `INITIAL_ADMIN_EMAIL`/`INITIAL_ADMIN_PASSWORD`) if the email is absent.
3. **Seed LITBANG** — `litbang@matius.id` (role `LITBANG`) if absent.
4. **Seed master doors** — seven default entry doors across three buildings (`Gedung Gereja Utama`, `Gedung Karya Pastoral (GKP)`, `Tenda & Selasar Luar`), keyed by stable `code`; pre-existing doors with an empty `building` get the building name back-filled.

All seed operations are idempotent, so restarts and repeated deploys are safe. On a fresh MySQL database, migrations and then a single start-up fully initialize the schema plus reference data.

---

## Troubleshooting

### SPA shows the JSON welcome message

**Cause:** `app/static/index.html` (and/or `app/static/assets/`) is missing or was not uploaded.

**Fix:** run `npm run build` in `frontend/`, re-upload `app/static/`, restart the app.

### 500 error on first request

Check the Passenger/application error log from the Setup Python App page (or the `~/.passenger/` style log path printed there). Common causes:

- Missing `.env` or malformed `DATABASE_URL`
- Wrong MySQL credentials or user without `ALL PRIVILEGES`
- `a2wsgi` or `pymysql` not installed (Step 4 skipped)
- `passenger_wsgi.py` not at the application root, or the startup file/entry point mismatch

### `alembic upgrade head` fails

- Confirm `.env` is present at the root and `DATABASE_URL` points at the MySQL database
- Confirm the MySQL user has `ALL PRIVILEGES` on the target database
- Confirm the cPanel virtual environment is activated in the terminal

### `ModuleNotFoundError: No module named 'app'`

**Cause:** the project root is not on `sys.path`.

**Fix:** keep `sys.path.insert(0, os.path.dirname(__file__))` in `passenger_wsgi.py` and ensure that file sits at the application root configured in cPanel.

---

## Related Pages

- [/openwiki/architecture/backend-overview.md](/openwiki/architecture/backend-overview.md) — FastAPI app structure, lifespan, routers, and middleware
- [/openwiki/architecture/data-model.md](/openwiki/architecture/data-model.md) — SQLAlchemy models, schema, and relationships
- [/openwiki/architecture/authentication.md](/openwiki/architecture/authentication.md) — JWT auth flow and RBAC configuration
