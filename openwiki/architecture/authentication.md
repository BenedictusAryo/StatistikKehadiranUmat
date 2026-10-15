---
type: architecture documentation
title: Authentication & Role-Based Access Control
description: >
  OpenWiki uses JWT-based authentication with bcrypt password hashing and a
  dual-role RBAC model (ADMIN, LITBANG). The backend issues tokens containing
  email and role claims; the frontend persists them in Zustand/localStorage and
  attaches them as Bearer tokens. User CRUD is restricted to ADMIN. Seed users
  are created at startup from .env configuration via init_db_and_seed().
tags: [backend, frontend, security, authentication, authorization]
verified:
  - by: openwiki/0.5.1
    at: 2026-10-04T04:05:02.987Z
sources:
  - id: openwiki-source-ed21615f607890262ae22e35
    resource: repo://app/auth.py
  - id: openwiki-source-27968b0140d9f4dbf73030e5
    resource: repo://app/config.py
  - id: openwiki-source-21c0a295e6c6f5529dc70d5f
    resource: repo://app/main.py
  - id: openwiki-source-b3dfe2a1ca1d982c53ecb3e4
    resource: repo://app/models.py
  - id: openwiki-source-1c018f0217d645dfd5cbfff0
    resource: repo://app/routers/auth.py
  - id: openwiki-source-454c9bcdde0b77b35e0fc994
    resource: repo://frontend/src/App.tsx
  - id: openwiki-source-b0ff5020148f91aa759b7578
    resource: repo://frontend/src/components/Navbar.tsx
  - id: openwiki-source-52c1db51d6242822023ffe23
    resource: repo://frontend/src/pages/LoginPage.tsx
  - id: openwiki-source-6ae98a6b4388ea2893802da8
    resource: repo://frontend/src/store/authStore.ts
generated: { by: "openwiki/0.5.1", at: "2026-10-04T04:05:02.987Z" }
---

# Authentication & Role-Based Access Control

## Overview

The system implements a **JWT-based stateless authentication** flow with two
predefined roles:

- **ADMIN (Tim IT)** — full system access, including user management, master
  position management, event management, and all data exports.
- **LITBANG (Tim Litbang)** — can create and manage events, monitor attendance
  in real time, and export data, but cannot manage users or master positions.

Both the backend (Python/FastAPI) and frontend (React/TypeScript) participate
in the authentication lifecycle. The backend enforces access at the API level
via FastAPI dependency injection; the frontend enforces access by conditionally
rendering UI elements based on the stored user role.

## Responsibilities

| Component | Responsibility |
|-----------|----------------|
| `app/auth.py` | Password hashing/verification (bcrypt), JWT creation/decode, `get_current_user` extraction, role-guard dependencies (`require_admin`, `require_litbang_or_admin`) |
| `app/config.py` (`Settings`) | Reads `SECRET_KEY`, `ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`, seed credentials from `.env` |
| `app/routers/auth.py` | REST endpoints: `/api/auth/login`, `/api/auth/me`, `/api/auth/users` (admin-only CRUD) |
| `app/main.py` (`init_db_and_seed()`) | Creates `users` table via SQLAlchemy metadata and seeds the two initial accounts at startup |
| `frontend/src/store/authStore.ts` | Zustand store with `persist` middleware; saves token + user to `localStorage` key `paroki-auth-storage`; exposes `setAuth()`, `logout()`, and the helper `getAuthHeaders()` |
| `frontend/src/pages/LoginPage.tsx` | Email/password form; posts to `/api/auth/login`; on success calls `setAuth()` and notifies parent via `onLoginSuccess` callback |
| `frontend/src/pages/UserManagementPage.tsx` | Admin-only page that lists, creates, and deletes users via the admin-guarded `/api/auth/users` endpoints |
| `frontend/src/components/Navbar.tsx` | Conditionally renders "Master Pintu" and "Pengguna" navigation links only when `user.role === 'ADMIN'`; displays current user name and role badge |
| `frontend/src/App.tsx` | Routes unauthenticated users to `LoginPage`; routes authenticated users to the dashboard based on `currentTab` state |

## Authentication Flow (Login → Token → Protected Request)

<!-- openwiki: mermaid parse failed and this diagram was converted to a text fence so it does not break rendering. Fix the diagram source and restore the mermaid fence. Parser error: Heuristic: an unescaped angle bracket inside a label breaks rendering; rephrase the label. -->
```text
sequenceDiagram
    participant User
    participant LoginPage
    participant authStore
    participant Backend as FastAPI Backend
    participant DB as SQLite DB

    User->>LoginPage: Enter email & password
    LoginPage->>Backend: POST /api/auth/login {email, password}
    Backend->>DB: Query User by email
    Backend->>Backend: bcrypt.verify_password(plain, hashed)
    alt Invalid credentials
        Backend-->>LoginPage: 401 "Email atau kata sandi salah"
        LoginPage-->>User: Show error banner
    else Inactive account
        Backend-->>LoginPage: 403 "Akun Anda dinonaktifkan"
        LoginPage-->>User: Show error banner
    else Success
        Backend->>Backend: jwt.encode({sub: email, role: role, exp: now + 24h})
        Backend-->>LoginPage: 200 {access_token, token_type, user}
        LoginPage->>authStore: setAuth(token, user)
        authStore->>localStorage: persist token + user
        LoginPage-->>User: Redirect to dashboard
    end

    Note over User,Backend: Subsequent requests
    User->>UserManagementPage: Navigate to user management
    UserManagementPage->>authStore: getAuthHeaders()
    authStore-->>UserManagementPage: {Authorization: "Bearer <token>"}
    UserManagementPage->>Backend: GET /api/auth/users (with Bearer header)
    Backend->>Backend: jwt.decode(token, SECRET_KEY, HS256)
    Backend->>Backend: get_current_user: query User by email, check is_active
    Backend->>Backend: require_admin: check role == ADMIN
    Backend-->>UserManagementPage: 200 [User, ...] or 403
```

## Key Mechanisms

### 1. Password Hashing (`app/auth.py`)

Passwords are hashed with **bcrypt** via the `bcrypt` library:

- `hash_password(password: str) -> str`: generates a salt via `bcrypt.gensalt()`
  and returns the hash as a UTF-8 decoded string.
- `verify_password(plain_password: str, hashed_password: str) -> bool`:
  uses `bcrypt.checkpw()`. Exceptions (e.g. malformed hash) are caught and
  return `False` rather than crashing.

### 2. JWT Token Creation (`app/auth.py`)

`create_access_token(data, expires_delta=None)`:

- Copies the input `data` dict and adds an `"exp"` claim.
- If no `expires_delta` is provided, the expiry defaults to
  `settings.ACCESS_TOKEN_EXPIRE_MINUTES` (1440 minutes = 24 hours).
- Signs with `settings.SECRET_KEY` using `settings.ALGORITHM` (`HS256`).
- The token payload includes `{"sub": email, "role": role, "exp": expiry}`.

### 3. Token Extraction & User Resolution (`app/auth.py`)

`get_current_user(credentials, db)` — the core FastAPI dependency:

1. Extracts the `Authorization: Bearer <token>` header via FastAPI's
   `HTTPBearer(auto_error=False)` scheme.
2. If no credentials are present, raises `401`.
3. Decodes the JWT with `jwt.decode()`. On failure (`PyJWTError`), raises `401`.
4. Extracts the `"sub"` claim (email) from the payload.
5. Queries the database for an active user matching that email.
6. If not found or inactive, raises `401`.

### 4. Role-Guard Dependencies (`app/auth.py`)

Two guard functions chain on `get_current_user`:

- `require_admin`: raises `403` unless `current_user.role == UserRole.ADMIN`.
- `require_litbang_or_admin`: raises `403` unless the role is `ADMIN` or `LITBANG`.

### 5. Token Persistence & Auth State (`frontend/src/store/authStore.ts`)

The frontend uses a **Zustand store** with the `persist` middleware. The store:

- Manages three fields: `user`, `token`, `isAuthenticated`.
- `setAuth(token, user)` sets all three fields to authenticated state.
- `logout()` clears all three and redirects the browser to `/login`.
- Persists state under the `localStorage` key `paroki-auth-storage`.
- Exports `getAuthHeaders()` — a plain function that reads the current token
  from the store and returns `{Authorization: 'Bearer <token>'}` or `{}`.

### 6. Seed Users (`app/main.py` `init_db_and_seed()`)

On application startup, `init_db_and_seed()`:

1. Creates all tables via `Base.metadata.create_all()`.
2. Checks if a `User` with `INITIAL_ADMIN_EMAIL` exists; if not, creates one
   with `INITIAL_ADMIN_PASSWORD` hashed via bcrypt, role `ADMIN`.
3. Checks if a `User` with `INITIAL_LITBANG_EMAIL` exists; if not, creates one
   with `INITIAL_LITBANG_PASSWORD` hashed via bcrypt, role `LITBANG`.
4. Also seeds default master positions (door entries) for the church.

The seed credentials are configured in `.env` (or `.env.example`):

```
INITIAL_ADMIN_EMAIL=admin@matius.id
INITIAL_ADMIN_PASSWORD=AdminMatius2026!
INITIAL_LITBANG_EMAIL=litbang@matius.id
INITIAL_LITBANG_PASSWORD=LitbangMatius2026!
```

### 7. Frontend Role-Based Access Control

The frontend does **not** trust the role from the client alone—it receives the
role from the server via the JWT (the login response includes the `user` object
with the `role` field). The frontend uses this to:

- **Conditionally render navigation items** (Navbar shows "Master Pintu" and
  "Pengguna" tabs only for `ADMIN` users).
- **Route to UserManagementPage** only for `ADMIN` users — the page itself
  depends on admin-only API endpoints that will return 403 if called by a
  non-ADMIN user.

## API Endpoints

### Public (no auth required)

| Method | Path | Pydantic Schema | Description |
|--------|------|----------------|-------------|
| POST | `/api/auth/login` | `UserLogin` → `TokenResponse` | Authenticate with email/password; returns JWT + user object |

### Authenticated (any active user)

| Method | Path | Pydantic Schema | Description |
|--------|------|----------------|-------------|
| GET | `/api/auth/me` | → `UserResponse` | Returns the currently authenticated user's profile |

### Admin-only

| Method | Path | Pydantic Schema | Description |
|--------|------|----------------|-------------|
| GET | `/api/auth/users` | → `List[UserResponse]` | List all users (ordered by id ascending) |
| POST | `/api/auth/users` | `UserCreate` → `UserResponse` | Create a new user (validates email uniqueness) |
| PUT | `/api/auth/users/{user_id}` | `UserUpdate` → `UserResponse` | Update user fields (partial); email uniqueness checked; role constrained to ADMIN or LITBANG |
| DELETE | `/api/auth/users/{user_id}` | → `{"message": ...}` | Delete a user; prevents self-deletion |

## Data Model: User

Defined in `app/models.py` as the SQLAlchemy `User` model (table `users`):

| Column | Type | Constraints |
|--------|------|-------------|
| `id` | `Integer` | Primary key, auto-increment |
| `email` | `String(128)` | Unique, indexed, not null |
| `hashed_password` | `String(255)` | Not null (bcrypt hash) |
| `full_name` | `String(128)` | Not null |
| `role` | `String(32)` | Not null, default `"LITBANG"` |
| `is_active` | `Boolean` | Not null, default `True` |
| `created_at` | `DateTime` | Not null, default `utcnow` |

The `UserRole` class defines two constants: `ADMIN = "ADMIN"` and `LITBANG = "LITBANG"`.

## Configuration

All auth-relevant settings are in `app/config.py` (`Settings` class), loaded from
`.env` via `pydantic-settings`:

| Setting | Default | Description |
|---------|---------|-------------|
| `SECRET_KEY` | `"st-matius-bintaro-secret-key-change-in-production-2026!"` | HMAC signing key for JWTs |
| `ALGORITHM` | `"HS256"` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `1440` (24 hours) | Token lifetime |
| `INITIAL_ADMIN_EMAIL` | `"admin@matius.id"` | Seed admin email |
| `INITIAL_ADMIN_PASSWORD` | `"AdminMatius2026!"` | Seed admin password (hashed at startup) |
| `INITIAL_LITBANG_EMAIL` | `"litbang@matius.id"` | Seed litbang email |
| `INITIAL_LITBANG_PASSWORD` | `"LitbangMatius2026!"` | Seed litbang password (hashed at startup) |
| `DATABASE_URL` | `"sqlite:///./statistik_umat.db"` | SQLAlchemy database URL |

## Invariants & Failure Modes

1. **Self-deletion prevention**: The `DELETE /api/auth/users/{user_id}` endpoint
   explicitly checks `if target.id == admin.id` and returns 400, preventing an
   admin from deleting their own account.
2. **Email uniqueness**: Both `POST` and `PUT` on `/api/auth/users` check for
   duplicate emails and return 400.
3. **Inactive accounts**: `get_current_user` filters `User.is_active == True`;
   an admin can deactivate a user via `PUT /api/auth/users/{id}` with
   `is_active: false`, which immediately blocks that user from all API access.
4. **Role constraint on creation/update**: Roles are validated against the
   `[ADMIN, LITBANG]` set. Any other value falls back to `LITBANG`.
5. **Token expiry**: Expired JWTs are rejected by `jwt.decode()` at the start
   of `get_current_user`, returning 401.
6. **Malformed passwords**: `verify_password` catches exceptions from
   `bcrypt.checkpw` and returns `False`, avoiding 500 errors on corrupt hashes.
7. **Database seeding is idempotent**: `init_db_and_seed()` queries for existing
   users by email before inserting, so restarting the application does not
   duplicate seed users.

## Extension Points

- **Adding a new role**: Add a constant to `UserRole` in `app/models.py`, create
  a new guard function in `app/auth.py` (e.g., `require_pastor`), and register
  it as a `Depends` on the relevant routes.
- **Different token expiry per route**: `create_access_token` accepts an optional
  `expires_delta` parameter; callers can pass a custom `timedelta`.
- **Refreshing tokens**: No refresh-token mechanism exists yet. To add one, a
  `/api/auth/refresh` endpoint could accept the existing (non-expired) token and
  issue a new one.
- **Audit logging**: The `metadata_json` column on `AttendanceLog` is available
  for recording authenticated action audit trails.

## Dev-Only Fast Login

The `LoginPage` includes a developer convenience feature: when `import.meta.env.DEV`
is true (Vite dev mode), two pill buttons appear below the login form to
pre-fill the Litbang and Admin credentials, reducing repetitive typing during
development. These pills are absent in the production build.

## Related Pages

- [Backend Overview](/openwiki/architecture/backend-overview.md)
- [Admin Dashboard](/openwiki/integrations/admin-dashboard.md)
