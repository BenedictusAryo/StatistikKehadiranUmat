#!/usr/bin/env python3
"""
WSGI config for Statistik Kehadiran Umat - Paroki Bintaro (cPanel deployment).

Bridge:    a2wsgi (ASGI -> WSGI)
Framework: FastAPI (app.main:app)
Server:    Phusion Passenger (CloudLinux / cPanel Python App)
"""

import os
import sys
from pathlib import Path

# 1. Force UTF-8 encoding BEFORE any output
if hasattr(sys.stdout, 'reconfigure') and sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure') and sys.stderr.encoding != 'utf-8':
    sys.stderr.reconfigure(encoding='utf-8')

os.environ['PYTHONIOENCODING'] = 'utf-8'
os.environ['LANG'] = 'en_US.UTF-8'
os.environ['LC_ALL'] = 'en_US.UTF-8'


# 2. Setup SafeWriter to prevent BrokenPipeError in Passenger
class SafeWriter:
    """Wrapper around a stream that silently absorbs BrokenPipeError / OSError in Passenger."""
    def __init__(self, stream, log_file=None):
        self._stream = stream
        self._log_file = log_file

    def write(self, data):
        if self._log_file:
            try:
                with open(self._log_file, 'a', encoding='utf-8') as f:
                    f.write(data)
            except Exception:
                pass
        try:
            return self._stream.write(data)
        except (BrokenPipeError, OSError):
            return len(data)

    def flush(self):
        try:
            return self._stream.flush()
        except (BrokenPipeError, OSError):
            pass

    def __getattr__(self, name):
        return getattr(self._stream, name)


# 3. Setup Project Paths & Logging
project_home = str(Path(__file__).resolve().parent)
if project_home not in sys.path:
    sys.path.insert(0, project_home)

logs_dir = Path(project_home) / 'logs'
try:
    logs_dir.mkdir(parents=True, exist_ok=True)
    passenger_log = str(logs_dir / 'passenger.log')
except Exception:
    passenger_log = None

sys.stdout = SafeWriter(sys.stdout, log_file=passenger_log)
sys.stderr = SafeWriter(sys.stderr, log_file=passenger_log)

print(f"[WSGI] Starting StatistikKehadiranUmat from: {project_home}", flush=True)

# 4. Detect and register virtualenv site-packages if present
venv_path = os.environ.get('VIRTUAL_ENV')
if venv_path:
    site_packages = Path(venv_path) / 'lib' / f"python{sys.version_info.major}.{sys.version_info.minor}" / 'site-packages'
    if site_packages.is_dir() and str(site_packages) not in sys.path:
        sys.path.insert(1, str(site_packages))
        print(f"[WSGI] Added VIRTUAL_ENV site-packages: {site_packages}", flush=True)

# 5. Load and bridge FastAPI application via a2wsgi
try:
    from a2wsgi import ASGIMiddleware
    from app.main import app

    print("[WSGI] Bridging FastAPI ASGI application via a2wsgi.ASGIMiddleware...", flush=True)
    # Expose WSGI application callable for Phusion Passenger
    application = ASGIMiddleware(app)
    print("[WSGI] Application loaded successfully and ready to serve.", flush=True)

except Exception as exc:
    print(f"[WSGI] FATAL ERROR during application initialization: {exc}", flush=True)
    import traceback
    traceback.print_exc()

    # Fallback WSGI application displaying a safe 500 error to clients
    def application(environ, start_response):
        status = '500 Internal Server Error'
        output = (
            b"500 Internal Server Error\n"
            b"Statistik Kehadiran Umat failed to start.\n"
            b"Please check logs/passenger.log or cPanel error logs for details.\n"
        )
        response_headers = [
            ('Content-Type', 'text/plain; charset=utf-8'),
            ('Content-Length', str(len(output))),
        ]
        start_response(status, response_headers)
        return [output]
