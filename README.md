# Aplikasi Statistik Kehadiran Umat - Gereja St. Matius Penginjil Paroki Bintaro

Aplikasi web *quick-survey* dan penghitungan kehadiran umat secara *real-time* berbasis **FastAPI (Python)** dan **React + Zustand + Tailwind CSS**. Dirancang khusus untuk kebutuhan Tim Litbang, Tim Komsos, dan Panitia Misa Besar (Natal, Paskah, Tri Hari Suci, Pelantikan Imamat, Misa OMK Keuskupan) di **Gereja St. Matius Penginjil, Paroki Bintaro - Keuskupan Agung Jakarta (KAJ)**.

---

## 🌟 Fitur Utama

### 1. Kiosk Pintu Masuk Petugas (Offline-First & Ultra Fast)
- **Akses Instan Tanpa Login**: Cukup scan QR Code unik per pos/pintu masuk (misal: Pintu Barat, Pintu Timur, dsb).
- **Pertanyaan Survei Tunggal**: *"Apakah Umat Paroki Bintaro?"* dengan 2 tombol sentuh berukuran besar:
  - 🟦 **Umat Paroki Bintaro** (St. Matius Penginjil)
  - 🟨 **Umat Luar Paroki** (Tamu / Peziarah)
- **Tahan Koneksi Lambat & Terputus (Offline-Ready)**:
  - Sentuhan dicatat instan di perangkat (< 5 milidetik) ke *LocalStorage* melalui Zustand Store.
  - Haptic feedback (getar halus) dan audio click saat tombol ditekan.
  - Setiap tap memiliki UUID idempotensi dan `client_timestamp` (waktu aktual umat menekan layar).
  - Background auto-sync otomatis mengirim antrean saat sinyal pulih kembali tanpa memblokir antrean umat.

### 2. Layar VideoTron & Pemantau Panitia (Real-Time & Responsif)
- **URL Publik VideoTron** (`/videotron/:eventId`): Dapat langsung ditampilkan di proyektor/videotron gereja sebelum misa dimulai, maupun diakses oleh panitia di smartphone.
- **Digital Clock WIB & Total Kehadiran**: Odometer angka kehadiran total dan persentase *Umat Paroki Bintaro* vs *Umat Luar Paroki*.
- **Grafik Waktu Kedatangan (Time Series Line Chart)**:
  - Menyajikan kurva kedatangan umat interval 5 menit dengan Recharts berdesain gelap kontras tinggi (neon cyan/sky blue).
  - Dilengkapi tombol pemilih mode tampilan:
    - 🔀 **Split**: Menampilkan kartu ringkasan angka di atas dan grafik kurva kedatangan real-time di bawah.
    - 🔢 **Angka Utama**: Tampilan odometer raksasa untuk layar umat berjalan masuk.
    - 📈 **Grafik Garis**: Kurva kedatangan layar penuh untuk panitia memantau puncak gelombang kedatangan.
- **Peringatan Kapasitas Kursi (Capacity Alert)**:
  - Dapat di-enable/disable per acara.
  - Menampilkan notifikasi visual saat kapasitas terisi **75%** (*Warning*) dan **95%** (*Kapasitas Penuh - Siapkan Kursi Selasar / Tenda Tambahan*).
- **Proteksi Database (In-Memory Smart Cache)**:
  - Dilengkapi *TTL Cache 3 detik* di backend FastAPI sehingga refresh serentak oleh videotron dan panitia tidak membebani database server.

### 3. Dashboard Admin & Tim Litbang
- **Manajemen Event ("Create Event")**:
  - Mendukung Misa, Gladi Bersih / Pelatihan, Seminar OMK, Pelantikan Imamat, dsb.
  - Default form placeholder overlay: `Contoh: Misa Natal 2026 - Pk 17:00 / Seminar OMK / Pelantikan Imamat`.
  - Pemilihan pos pintu masuk otomatis dikelompokkan berdasarkan **Gedung & Zona** dengan tombol toggle *"Pilih Zona Ini"*.
- **Hierarki Pos Jaga (Gedung / Ruangan / Zona)**:
  - Dirancang khusus untuk mengelola lonjakan umat pada Misa Akbar (Natal, Tri Hari Suci, dsb) yang memanfaatkan ruangan cadangan:
    - 🏛️ **Gedung Gereja Utama**: Pintu Utama/Barat, Pintu Timur, Pintu Utara, Pintu Balkon.
    - 🏢 **Gedung Karya Pastoral (GKP)**: Auditorium Lt. 2, Ruang Serbaguna Lt. 1.
    - 🎪 **Tenda & Selasar Luar**: Tenda Selasar / Plaza Depan.
  - Statistik *real-time* dan breakdown kehadiran dipisahkan per gedung/zona untuk membantu panitia dan seksi tata tertib membagi arus umat.
- **Grafik Lonjakan Kedatangan per 5 Menit**:
  - Tersedia opsi toggle **Grafik Garis (Line Chart)** dan **Diagram Batang (Bar Chart)** di dashboard detail event.
- **Master Data Pintu & Ruangan (Admin IT)**: Mengatur pos dan gedung default yang dapat disesuaikan fleksibel.
- **Kontrol Hak Akses Ringan (RBAC)**:
  - **ADMIN (Tim IT)**: Akses penuh ke sistem, Master Data Pintu, dan Manajemen Akun Pengguna.
  - **LITBANG**: Manajemen Event, Monitor Kehadiran Realtime, Unduh CSV, dan Cetak PDF.
- **Laporan dan Evaluasi Resmi Litbang (Sesuai Format Baku Paroki)**:
  - **Kop Surat & 3 Kartu KPI Hijau**: Total Kehadiran, % & Jumlah Umat Paroki Bintaro, % & Jumlah Umat Luar Paroki.
  - **Bagian A (Waktu Kedatangan)**: Line Chart kurva kedatangan interval 5 menit dengan label angka di atas titik data dan analisis rentang jam puncak otomatis.
  - **Bagian B (Observasi)**: Pita kategori merah (📐 Tata Ruang, 👥 Tata Laksana, 🎙️ Audio - Visual, dsb) beserta poin-poin observasi.
  - **Bagian C (Rekomendasi Seksi Litbang)**: Kotak rekomendasi dan saran tindak lanjut.
  - **Bagian D (Rincian Pos Pintu Masuk)**: Tabel pos terbagi per gedung dengan subtotal otomatis.
  - **Bagian Penutup**: Pita hijau kesimpulan umum pelaksanaan misa/acara.
  - **Editor Catatan Interaktif**: Tombol *"Edit Catatan & Evaluasi"* untuk menambah/mengedit/menghapus poin observasi dan rekomendasi dengan penyimpanan langsung ke database server (`PUT /api/events/{id}/evaluation-notes`).
  - **Download CSV**: Data mentah per sentuhan beserta kolom `Gedung_Lokasi` dan timestamp untuk Microsoft Excel.

---

## 🛠️ Arsitektur & Teknologi

| Bagian | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Backend** | Python 3.10+ / FastAPI | Endpoint RESTful async, validasi Pydantic v2, JWT Auth |
| **Database** | SQLite (Dev) / MySQL (cPanel) | Abstraksi via SQLAlchemy ORM & Alembic Migration |
| **Frontend** | React 18, Vite, TypeScript | SPA yang di-*bundle* langsung ke folder `app/static` FastAPI |
| **State Management** | Zustand (Offline Persistence) | Antrean *offline-first* dengan auto-retry sync |
| **Styling** | Tailwind CSS & Lucide Icons | Desain high-contrast, responsif ponsel/tablet/videotron |
| **Charts** | Recharts | Visualisasi lonjakan umat per 5 menit |
| **cPanel Deployment** | `passenger_wsgi.py` (a2wsgi) | Kompatibel dengan Phusion Passenger cPanel |

---

## 🚀 Panduan Menjalankan Secara Lokal (Development)

### 1. Kloning & Masuk ke Direktori
```bash
git clone https://github.com/BenedictusAryo/StatistikKehadiranUmat.git
cd StatistikKehadiranUmat
```

### 2. Setup Virtual Environment Python & Dependensi
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```
Default kredensial awal yang langsung siap digunakan:
- **Admin IT**: `admin@matius.id` / `AdminMatius2026!`
- **Litbang**: `litbang@matius.id` / `LitbangMatius2026!`

### 4. Jalankan Migrasi Database
```bash
alembic upgrade head
```

### 5. Build Frontend React
```bash
cd frontend
npm install
npm run build
cd ..
```
*(Build akan otomatis menempatkan file HTML, JS, dan CSS ke dalam `app/static/`)*

### 6. Jalankan Server FastAPI
```bash
uvicorn app.main:app --reload --port 8000
```
Buka browser Anda di:
- **Dashboard Admin & Litbang**: [http://localhost:8000/](http://localhost:8000/)
- **Dokumentasi API Swagger**: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 🧪 Menjalankan Automated Tests (Pytest)
```bash
pytest tests/
```

---

## 🌐 Panduan Deploy ke Hosting cPanel Paroki

cPanel Paroki mendukung aplikasi Python melalui fitur **Setup Python App** (Phusion Passenger).

1. **Buat Database MySQL di cPanel**:
   - Buka menu **MySQL Databases** di cPanel.
   - Buat database baru (misal: `paroki_statistik`) dan user MySQL dengan password yang aman.
   - Berikan hak akses `ALL PRIVILEGES` pada database tersebut.

2. **Setup Python App di cPanel**:
   - Buka menu **Setup Python App**.
   - Klik **Create Application**:
     - **Python Version**: Pilih `3.10` atau versi terbaru yang tersedia.
     - **Application root**: `statistik_umat` (atau path folder project Anda).
     - **Application URL**: `statistik.matius.id` (atau subdirektori paroki).
     - **Application startup file**: `passenger_wsgi.py`
     - **Application Entry point**: `application`

3. **Unggah File Proyek**:
   - Unggah seluruh file proyek (kecuali folder `.venv` lokal dan `frontend/node_modules`).
   - Pastikan folder `app/static` hasil `npm run build` ikut terunggah.

4. **Instal Dependensi di Server**:
   - Salin perintah terminal virtual environment yang ditampilkan di halaman cPanel Python App.
   - Buka menu **Terminal** di cPanel, tempel perintah tersebut, lalu jalankan:
     ```bash
     pip install -r requirements.txt
     ```

5. **Konfigurasi File `.env` di Server**:
   - Edit file `.env` di cPanel File Manager:
     ```env
     DATABASE_URL=mysql+pymysql://user_db:password_db@localhost:3306/paroki_statistik?charset=utf8mb4
     SECRET_KEY=kunci-rahasia-paroki-yang-sangat-aman-dan-panjang!
     ```

6. **Jalankan Migrasi Database di Server**:
   - Di terminal cPanel:
     ```bash
     alembic upgrade head
     ```

7. **Restart Aplikasi**:
   - Klik tombol **Restart** pada halaman Setup Python App di cPanel, atau jalankan `touch passenger_wsgi.py`.
   - Aplikasi kini aktif dan siap melayani Misa!

> 📘 **Panduan Lengkap cPanel & MySQL**: Lihat panduan langkah demi langkah yang lebih detail dan script otomasi di [CPANEL_DEPLOYMENT_MYSQL.md](CPANEL_DEPLOYMENT_MYSQL.md). Tersedia script wizard `python database_config.py` dan script otomasi `bash deploy_production.sh`.

---

## 📋 Struktur Direktori Proyek

```
StatistikKehadiranUmat/
├── alembic/                # Skrip migrasi database Alembic
├── app/
│   ├── routers/
│   │   ├── auth.py         # Login, Profil & Manajemen Pengguna
│   │   ├── counter.py      # Kiosk validation & batch tap sync (Offline-first)
│   │   ├── master_pos.py   # CRUD Master pintu masuk
│   │   ├── misa.py         # CRUD Event ("Create Event") & status
│   │   └── stats.py        # Realtime cached stats, time-series & CSV export
│   ├── static/             # Hasil build frontend (SPA index.html & assets)
│   ├── auth.py             # Keamanan password & JWT token
│   ├── cache.py            # In-memory TTL cache (3-5 detik)
│   ├── config.py           # Konfigurasi via Pydantic Settings
│   ├── database.py         # SQLAlchemy engine & session factory
│   ├── main.py             # FastAPI entry point & SPA fallback
│   ├── models.py           # Model database SQLAlchemy
│   └── schemas.py          # Schema Pydantic request/response
├── frontend/
│   ├── src/
│   │   ├── components/     # Navbar, QrModal, dll
│   │   ├── pages/
│   │   │   ├── AdminDashboard.tsx      # Dashboard Event & "Create Event"
│   │   │   ├── EventDetailDashboard.tsx# Monitor live event & grafik lonjakan
│   │   │   ├── KioskPage.tsx           # Kiosk layar sentuh petugas pos
│   │   │   ├── LoginPage.tsx           # Halaman login
│   │   │   ├── MasterPosPage.tsx       # Pengaturan pintu default
│   │   │   ├── ReportPrintView.tsx     # Laporan cetak PDF resmi A4
│   │   │   ├── UserManagementPage.tsx  # Pengaturan akun IT & Litbang
│   │   │   └── VideotronPage.tsx       # Tampilan publik Videotron gereja
│   │   ├── store/
│   │   │   ├── authStore.ts            # Zustand auth storage
│   │   │   └── offlineQueueStore.ts    # Zustand offline-first sync queue
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── types.ts
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
├── tests/
│   └── test_api.py         # Pytest API suite
├── passenger_wsgi.py       # WSGI adapter untuk cPanel Phusion Passenger
├── requirements.txt        # Dependensi Python
├── .env.example            # Contoh template environment
└── README.md               # Dokumentasi lengkap proyek
```

---

Dibuat dengan penuh dedikasi untuk pelayanan **Gereja St. Matius Penginjil Paroki Bintaro**.
