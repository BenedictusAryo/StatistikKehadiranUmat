#!/usr/bin/env python3
"""
MySQL Database Configuration & Connection Tester for cPanel Deployment.
Project: Statistik Kehadiran Umat - Paroki Bintaro

Usage:
    python database_config.py         # Run interactive setup wizard
    python database_config.py --test  # Test connection to MySQL database
    python database_config.py --info  # Display current configuration status
"""

import os
import sys
import secrets
from pathlib import Path


def generate_secret_key(length: int = 50) -> str:
    """Generate cryptographically secure random secret key."""
    chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*(-_=+)'
    return ''.join(secrets.choice(chars) for _ in range(length))


def setup_database_config():
    print("=" * 70)
    print("  MySQL Database Configuration Setup for cPanel")
    print("  Statistik Kehadiran Umat - Gereja St. Matius Penginjil Paroki Bintaro")
    print("=" * 70)
    print("Masukkan informasi detail database MySQL dari cPanel Anda:\n")

    db_name = input("Nama Database (contoh: parh4868_statistik): ").strip()
    db_user = input("Pengguna / User DB (contoh: parh4868_dbuser): ").strip()
    db_password = input("Password DB: ").strip()
    db_host = input("Host Database [default: localhost]: ").strip() or "localhost"
    db_port = input("Port Database [default: 3306]: ").strip() or "3306"

    print("\n--- Kredensial Akun Default Awal ---")
    admin_email = input("Email Admin IT [default: admin@matius.id]: ").strip() or "admin@matius.id"
    admin_pass = input("Password Admin IT [default: AdminMatius2026!]: ").strip() or "AdminMatius2026!"
    litbang_email = input("Email Litbang [default: litbang@matius.id]: ").strip() or "litbang@matius.id"
    litbang_pass = input("Password Litbang [default: LitbangMatius2026!]: ").strip() or "LitbangMatius2026!"

    secret_key = generate_secret_key(64)

    env_content = f"""# ==============================================================================
# Environment Configuration - Statistik Kehadiran Umat Paroki Bintaro
# Generated automatically via database_config.py
# ==============================================================================

# Database Configuration (MySQL / MariaDB on cPanel)
DATABASE_URL=mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}?charset=utf8mb4

# Security Settings
SECRET_KEY={secret_key}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Initial Admin & Litbang Seed Credentials
INITIAL_ADMIN_EMAIL={admin_email}
INITIAL_ADMIN_PASSWORD={admin_pass}
INITIAL_LITBANG_EMAIL={litbang_email}
INITIAL_LITBANG_PASSWORD={litbang_pass}

# Application Metadata & Cache
APP_NAME=Statistik Kehadiran Umat - Paroki Bintaro
PARISH_NAME=Gereja St. Matius Penginjil Paroki Bintaro
CACHE_TTL_SECONDS=3
"""

    env_path = Path(__file__).resolve().parent / '.env'
    with open(env_path, 'w', encoding='utf-8') as f:
        f.write(env_content)

    print(f"\n[OK] Konfigurasi berhasil disimpan ke: {env_path}")
    print("\nLangkah selanjutnya:")
    print("  1. Uji koneksi database:  python database_config.py --test")
    print("  2. Jalankan migrasi:      alembic upgrade head")
    print("  3. Atau jalankan script:  bash deploy_production.sh")
    print("=" * 70)


def test_mysql_connection():
    print("=" * 70)
    print("  Menguji Koneksi Database")
    print("=" * 70)

    try:
        import pymysql
    except ImportError:
        print("[ERROR] Library 'pymysql' belum terinstall!")
        print("Silakan jalankan: pip install pymysql")
        return False

    env_path = Path(__file__).resolve().parent / '.env'
    if not env_path.exists():
        print(f"[ERROR] File .env tidak ditemukan di {env_path}")
        print("Silakan jalankan konfigurasi: python database_config.py")
        return False

    # Load DATABASE_URL from .env
    db_url = None
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if line.startswith("DATABASE_URL="):
                db_url = line.split("=", 1)[1].strip().strip('"').strip("'")
                break

    if not db_url:
        print("[ERROR] Variabel DATABASE_URL tidak ditemukan di .env")
        return False

    print(f"[INFO] Mencoba menghubungkan ke:")
    if "@" in db_url:
        prefix, host_info = db_url.split("@", 1)
        scheme = prefix.split("://")[0]
        print(f"       Engine: {scheme}")
        print(f"       Target: {host_info}")
    else:
        print(f"       Target: {db_url}")

    try:
        from sqlalchemy import create_engine, text

        engine = create_engine(db_url, pool_pre_ping=True)
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1")).scalar()
            if result == 1:
                print("\n[SUCCESS] Berhasil terhubung ke database!")
                
                # Check tables
                table_res = conn.execute(text("SHOW TABLES;")) if "mysql" in db_url else []
                tables = [row[0] for row in table_res] if table_res else []
                if tables:
                    print(f"[INFO] Tabel yang ditemukan ({len(tables)}): {', '.join(tables)}")
                else:
                    print("[INFO] Database masih kosong. Siap menjalankan: alembic upgrade head")
                return True
    except Exception as exc:
        print(f"\n[FAILED] Gagal terhubung ke database:")
        print(f"Detail error: {exc}")
        print("\nSaran pemeriksaan:")
        print("1. Pastikan nama database, user, dan password sudah benar.")
        print("2. Pastikan user MySQL telah diberi centang 'ALL PRIVILEGES' pada database tersebut di cPanel.")
        print("3. Di cPanel shared hosting, host database umumnya adalah 'localhost'.")
        return False


def display_info():
    env_path = Path(__file__).resolve().parent / '.env'
    print("=" * 70)
    print("  Informasi Status Konfigurasi")
    print("=" * 70)
    if env_path.exists():
        print(f"[STATUS] File .env ditemukan di: {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith("DATABASE_URL="):
                    val = line.strip().split("=", 1)[1]
                    if "@" in val:
                        user_part, host_part = val.split("@", 1)
                        print(f"DATABASE_URL: ***@{host_part}")
                    else:
                        print(f"DATABASE_URL: {val}")
                elif line.startswith("APP_NAME=") or line.startswith("INITIAL_ADMIN_EMAIL="):
                    print(line.strip())
    else:
        print("[STATUS] File .env belum dibuat. Jalankan: python database_config.py")
    print("=" * 70)


if __name__ == '__main__':
    if len(sys.argv) > 1:
        arg = sys.argv[1].lower()
        if arg in ('--test', '-t'):
            test_mysql_connection()
        elif arg in ('--info', '-i'):
            display_info()
        else:
            print("Pilihan argumen:")
            print("  python database_config.py         (Setup wizard interaktif)")
            print("  python database_config.py --test  (Uji koneksi database)")
            print("  python database_config.py --info  (Tampilkan status konfigurasi)")
    else:
        setup_database_config()
