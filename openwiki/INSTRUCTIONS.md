# OpenWiki Instructions: Statistik Kehadiran Umat

## Project Domain & Overview
This repository contains **Aplikasi Statistik Kehadiran Umat** for **Gereja St. Matius Penginjil, Paroki Bintaro (Keuskupan Agung Jakarta / KAJ)**.
It is a real-time, offline-first attendance counting and survey system for church masses, holy week liturgies, and parish events.

## Key Architectural Priorities to Document
When generating or updating wiki documentation:

1. **Offline-First Kiosk Workflow**:
   - Detail the kiosk entrance architecture (`/kiosk/:posToken`).
   - Taps must be recorded with `< 5ms` latency in local storage via Zustand (`offlineQueueStore.ts`).
   - Explain idempotent UUID generation, client-side timestamps, audio/haptic feedback, and the automatic 6-second background sync cycle.

2. **Videotron & Real-Time Monitoring**:
   - Explain `/videotron/:eventId` display modes (`SPLIT`, `NUMBERS`, `CHART`).
   - Document the 15-minute arrival time-series chart (Recharts) and capacity thresholds (75% warning, 95% full).
   - Document the backend in-memory TTL cache (3 seconds) in `app/cache.py` that shields the database from mass concurrent requests.

3. **Admin & Litbang Official Reporting**:
   - Document the event lifecycle: `SCHEDULED` → `OPEN` → `COMPLETED`.
   - Explain the hierarchy of attendance positions: Building / Zone (`Gedung Gereja Utama`, `Gedung Karya Pastoral / GKP`, `Tenda & Selasar Luar`).
   - Detail the official Parish Litbang report layout: KPI summary cards, Section A (arrival curve), Section B (observation categories: Tata Ruang, Tata Laksana, Audio-Visual), Section C (recommendations), and Section D (per-building door tables).

4. **Deployment & Environment Differences**:
   - Document development with SQLite (`statistik_umat.db`).
   - Document production on cPanel shared hosting using Phusion Passenger with `passenger_wsgi.py` (a2wsgi) and MySQL.
   - Mention database migrations via Alembic.

5. **Role-Based Access Control (RBAC)**:
   - `ADMIN` (Tim IT): Full permissions, user management, master door management.
   - `LITBANG` (Tim Litbang): Event creation/management, real-time monitoring, CSV export, and report printing.
