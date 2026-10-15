#!/bin/bash
# ==============================================================================
# Deployment Script for cPanel Production (Phusion Passenger + FastAPI)
# Project: Statistik Kehadiran Umat - Paroki Bintaro
# ==============================================================================
set -e

echo "======================================================================"
echo "  Deploying Statistik Kehadiran Umat (cPanel Production)"
echo "======================================================================"
echo ""

# 1. Verify working directory
if [ ! -f "passenger_wsgi.py" ] || [ ! -f "alembic.ini" ]; then
    echo "❌ ERROR: passenger_wsgi.py atau alembic.ini tidak ditemukan."
    echo "   Pastikan Anda menjalankan script ini dari root direktori proyek."
    exit 1
fi

PROJECT_DIR=$(pwd)
echo "✓ Direktori Proyek: $PROJECT_DIR"

# 2. Activate virtual environment if available
if [ -n "$VIRTUAL_ENV" ]; then
    echo "✓ Virtualenv sudah aktif: $VIRTUAL_ENV"
elif [ -n "$1" ] && [ -f "$1/bin/activate" ]; then
    echo "✓ Mengaktifkan virtualenv dari argumen: $1"
    source "$1/bin/activate"
else
    # Auto-detect cPanel virtualenv paths
    CPANEL_VENV=$(find "$HOME/virtualenv" -type f -name "activate" 2>/dev/null | head -n 1 || true)
    if [ -n "$CPANEL_VENV" ] && [ -f "$CPANEL_VENV" ]; then
        echo "✓ Mengaktifkan cPanel virtualenv: $CPANEL_VENV"
        source "$CPANEL_VENV"
    elif [ -f ".venv/bin/activate" ]; then
        echo "✓ Mengaktifkan virtualenv lokal: .venv"
        source ".venv/bin/activate"
    else
        echo "⚠ Virtual environment tidak terdeteksi otomatis, menggunakan Python sistem..."
    fi
fi

# 3. Check environment configuration (.env)
if [ -f ".env" ]; then
    echo "✓ File konfigurasi .env ditemukan."
else
    echo "⚠ PERINGATAN: File .env belum ditemukan!"
    echo "  Membuat .env dari .env.example..."
    cp .env.example .env
    echo "  Silakan edit .env atau jalankan: python database_config.py"
fi

# 4. Install / Update Python dependencies
echo ""
echo "📦 Memperbarui dependensi Python (requirements.txt)..."
python -m pip install --upgrade pip --quiet 2>/dev/null || true
python -m pip install -r requirements.txt

# 5. Run Database Migrations via Alembic
echo ""
echo "🗃️ Menjalankan migrasi database (Alembic)..."
alembic upgrade head
echo "✓ Migrasi skema database berhasil diterapkan."

# 6. Verify or build frontend static files
echo ""
echo "🎨 Memeriksa file frontend React SPA (app/static)..."
if [ ! -f "app/static/index.html" ] || [ ! -d "app/static/assets" ]; then
    echo "⚠ Bundle frontend di app/static belum lengkap."
    if command -v npm &> /dev/null && [ -d "frontend" ]; then
        echo "🔨 Menjalankan build frontend via npm..."
        (cd frontend && npm install && npm run build)
        echo "✓ Build frontend selesai."
    else
        echo "❌ Peringatan: npm tidak ditemukan di server. Pastikan Anda telah melakukan build lokal (npm run build) sebelum mengupload proyek."
    fi
else
    echo "✓ File statis frontend (index.html dan hashed assets) siap."
fi

# 7. Setup runtime directories and permissions
echo ""
echo "📁 Menyiapkan folder runtime dan hak akses..."
mkdir -p logs tmp app/static
chmod 755 logs tmp app/static 2>/dev/null || true
find app/static -type f -exec chmod 644 {} \; 2>/dev/null || true
find app/static -type d -exec chmod 755 {} \; 2>/dev/null || true

# 8. Trigger Passenger application restart
echo ""
echo "🔄 Memicu restart Phusion Passenger..."
touch passenger_wsgi.py
touch tmp/restart.txt
echo "✓ Sinyal restart Passenger berhasil dikirim."

# 9. Verify deployment
echo ""
echo "🧪 Menguji status aplikasi..."
sleep 2

if command -v curl &> /dev/null; then
    HEALTH_URL="http://127.0.0.1:8000/api/health"
    echo "Mencoba request lokal ke API health..."
    curl -s -I "$HEALTH_URL" 2>/dev/null | head -n 1 || echo "(Aplikasi akan otomatis online saat menerima traffic publik cPanel)"
fi

echo ""
echo "======================================================================"
echo "  🎉 Deployment Berhasil Diselesaikan!"
echo "======================================================================"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Buka URL domain aplikasi di browser."
echo "  2. Login dengan akun admin default (dari .env atau INITIAL_ADMIN_EMAIL)."
echo "  3. Jika ingin menambahkan data simulasi demo misa, jalankan:"
echo "     python seed_demo.py"
echo "  4. Untuk memantau log aplikasi secara realtime:"
echo "     tail -f logs/passenger.log"
echo "======================================================================"
