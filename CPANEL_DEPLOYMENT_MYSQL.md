# Panduan Deployment cPanel & MySQL - Statistik Kehadiran Umat Paroki Bintaro

Panduan ini mendokumentasikan langkah demi langkah proses deployment aplikasi **Statistik Kehadiran Umat (Gereja St. Matius Penginjil Paroki Bintaro)** ke cPanel shared hosting menggunakan **Setup Python App (Phusion Passenger)**, adapter WSGI/ASGI **`a2wsgi`**, dan database **MySQL / MariaDB**.

---

## 📋 Informasi Arsitektur & Lingkungan Server

| Parameter | Nilai Rekomendasi cPanel | Keterangan |
|---|---|---|
| **Framework Backend** | FastAPI (ASGI) | Python 3.10, 3.11, atau 3.12 |
| **WSGI to ASGI Bridge** | `a2wsgi` (`ASGIMiddleware`) | Menjembatani Phusion Passenger (WSGI) ke FastAPI (ASGI) |
| **Frontend Web** | React + Vite + Tailwind CSS | Dikompilasi ke direktori `app/static/` |
| **Database Engine** | MySQL 5.7+ / MariaDB 10.3+ | Driver: `pymysql` via SQLAlchemy |
| **Database Migration** | Alembic | Mengatur versi skema tabel otomatis |
| **Application Startup File** | `passenger_wsgi.py` | Berada di root direktori aplikasi |
| **Application Entry Point** | `application` | Objek WSGI callable di `passenger_wsgi.py` |

---

## 🚀 Langkah-langkah Deployment

### Langkah 1: Buat Database MySQL di cPanel

1. Masuk ke **cPanel** &rarr; cari menu **MySQL Databases** atau **MySQL Database Wizard**.
2. **Buat Database Baru**:
   - Contoh nama: `parh4868_statistik`
3. **Buat Pengguna Database (User)**:
   - Contoh username: `parh4868_dbuser`
   - Masukkan password yang kuat dan catat dengan aman.
4. **Hubungkan User ke Database**:
   - Pilih User dan Database yang baru dibuat &rarr; klik **Add**.
   - Centang **ALL PRIVILEGES** &rarr; klik **Make Changes**.

---

### Langkah 2: Setup Python App di cPanel

1. Masuk ke menu **Setup Python App** di cPanel.
2. Klik tombol **Create Application**:
   - **Python Version**: Pilih `3.11` (atau `3.10` / `3.12`)
   - **Application Root**: Masukkan path folder aplikasi (contoh: `public_html/statistik.matius.id` atau `statistik_umat`)
   - **Application URL**: Masukkan domain atau subdomain (contoh: `statistik.matius.id`)
   - **Application Startup File**: `passenger_wsgi.py`
   - **Application Entry Point**: `application`
3. Klik **Create**.
4. cPanel akan menampilkan perintah untuk mengaktifkan virtual environment di bagian atas halaman, contohnya:
   ```bash
   source /home/parh4868/virtualenv/public_html/statistik.matius.id/3.11/bin/activate && cd /home/parh4868/public_html/statistik.matius.id
   ```

---

### Langkah 3: Persiapan & Upload Kode Aplikasi

#### A. Build Frontend Terlebih Dahulu (di Komputer Lokal)
Frontend React SPA perlu di-build sebelum diunggah ke server:
```bash
cd frontend
npm install
npm run build
cd ..
```
*Hasil build Vite akan otomatis berada di folder `app/static/` (terdiri dari `index.html` dan `assets/`). Folder `app/static/` ini WAJIB diunggah ke server.*

#### B. Upload ke cPanel
Anda dapat menggunakan **Terminal cPanel (Git)** atau **File Manager (ZIP)**:

##### Opsi 1: Menggunakan Git via Terminal cPanel (Direkomendasikan)
1. Buka menu **Terminal** di cPanel.
2. Jalankan perintah aktivasi virtualenv:
   ```bash
   source /home/<username>/virtualenv/<app_path>/<python_version>/bin/activate
   cd /home/<username>/<app_path>
   ```
3. Clone atau pull kode ke direktori tersebut:
   ```bash
   git clone <URL_REPOSITORY> .
   ```

##### Opsi 2: Menggunakan File Manager (ZIP Upload)
1. Kompres seluruh proyek menjadi file ZIP (jangan masukkan `node_modules/`, `frontend/node_modules/`, `.venv/`, atau `__pycache__/`).
2. Masuk ke **File Manager** cPanel &rarr; navigasikan ke folder Application Root.
3. Upload ZIP dan ekstrak langsung di root folder aplikasi.

---

### Langkah 4: Konfigurasi Database (`database_config.py`)

Jalankan tool konfigurasi interaktif yang telah disediakan:
```bash
python database_config.py
```
Masukkan nama database, user, password, dan kredensial default admin saat diminta. Script akan secara otomatis:
- Menghasilkan `SECRET_KEY` kriptografis yang aman.
- Membuat file konfigurasi `.env`.

**Uji Koneksi Database:**
```bash
python database_config.py --test
```
*Pastikan muncul pesan `[SUCCESS] Berhasil terhubung ke database!`.*

---

### Langkah 5: Jalankan Script Otomasi Deployment

Jalankan script otomatisasi yang telah disiapkan:
```bash
bash deploy_production.sh
```

Script ini secara otomatis melakukan:
1. Memeriksa keberadaan virtual environment.
2. Memperbarui dependensi Python dari `requirements.txt` (termasuk `a2wsgi`, `pymysql`, `fastapi`, `alembic`, dll).
3. Menjalankan migrasi skema tabel ke MySQL via `alembic upgrade head`.
4. Memvalidasi ketersediaan file bundle frontend di `app/static/`.
5. Menyiapkan hak akses direktori `logs/`, `tmp/`, dan `app/static/` (`755` untuk folder, `644` untuk file).
6. Memicu restart server Passenger (`touch passenger_wsgi.py` & `touch tmp/restart.txt`).

---

### Langkah 6: Inisialisasi Data Default

Saat pertama kali dijalankan, sistem secara otomatis melakukan seeding data default (Akun Admin IT, Akun Litbang, dan 7 Pos Pintu Default).

Jika ingin menambahkan data simulasi misa/demo dengan rekaman kehadiran contoh:
```bash
python seed_demo.py
```

---

### Langkah 7: Restart Aplikasi & Verifikasi

Untuk memicu restart aplikasi kapan saja:
```bash
touch passenger_wsgi.py
touch tmp/restart.txt
```
*(Atau klik tombol **Restart** pada menu **Setup Python App** di cPanel)*.

Buka browser dan akses URL domain aplikasi:
- **Halaman Utama / Dashboard Litbang**: `https://statistik.matius.id/`
- **Login Petugas / Admin**: `https://statistik.matius.id/` (login via tombol di kanan atas)
- **Tampilan Videotron / Publik**: `https://statistik.matius.id/videotron/<event-id>`
- **Kiosk Counter Pintu**: `https://statistik.matius.id/pos/<token-pos>`
- **Dokumentasi API Swagger**: `https://statistik.matius.id/docs`

---

## 🔍 Troubleshooting (Penyelesaian Masalah)

### 1. Error 500 Internal Server Error saat membuka website
Periksa file log aplikasi yang tersimpan di direktori proyek:
```bash
cat logs/passenger.log
# atau pantau secara realtime:
tail -f logs/passenger.log
```
Penyebab umum:
- Password atau nama database di `.env` salah.
- Library `pymysql` atau `a2wsgi` belum terinstall di virtualenv cPanel (`pip install -r requirements.txt`).
- Migrasi database belum dijalankan (`alembic upgrade head`).

### 2. Tampilan web hanya berupa teks JSON atau Blank Screen
Penyebab: Bundle frontend di `app/static/` belum diunggah atau belum lengkap.
Solusi: Jalankan `npm run build` di folder `frontend` pada komputer lokal, lalu upload folder `app/static/` (beserta `index.html` dan subfolder `assets/`) ke root direktori cPanel.

### 3. Masalah Karakter Emoji / Simbol di MySQL
Jika terjadi error encoding pada log evaluasi atau nama misa:
Pastikan koneksi di `.env` menyertakan parameter `charset=utf8mb4`:
```env
DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/dbname?charset=utf8mb4
```

### 4. Broken Pipe Error pada Passenger
Script `passenger_wsgi.py` telah dilengkapi kelas `SafeWriter` khusus yang secara otomatis menyerap error `BrokenPipeError` / `OSError` saat koneksi client terputus sebelum Passenger sempat menyelesaikan flush output.

---

## 📁 Struktur File Deployment

```text
├── .htaccess                 # Konfigurasi Apache, redirect HTTPS, proteksi file rahasia
├── .env                      # Konfigurasi database MySQL & SECRET_KEY (jangan commit ke Git)
├── .env.example              # Template variabel konfigurasi
├── passenger_wsgi.py         # Entry point Phusion Passenger dengan bridge a2wsgi & SafeWriter
├── database_config.py        # CLI helper setup & tester koneksi database MySQL
├── deploy_production.sh      # Script bash otomatisasi deployment produksi
├── requirements.txt          # Dependensi Python (FastAPI, a2wsgi, pymysql, alembic, dll)
├── alembic.ini               # Konfigurasi migrasi database Alembic
├── alembic/                  # Script revisi migrasi skema tabel
├── app/
│   ├── main.py               # Inisialisasi FastAPI & mount static frontend
│   ├── database.py           # Engine SQLAlchemy & koneksi pool
│   ├── models.py             # Model tabel basis data
│   └── static/               # Hashed production build React SPA (index.html, assets/)
├── logs/
│   └── passenger.log         # Log startup dan error Phusion Passenger
└── tmp/
    └── restart.txt           # File trigger restart Passenger
```
