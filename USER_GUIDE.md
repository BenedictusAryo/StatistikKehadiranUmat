# Buku Panduan Pengguna (User Guide)
## Sistem Informasi Statistik & Counter Kehadiran Umat
**Gereja Santo Matius Penginjil — Paroki Bintaro**  
**Alamat Portal Resmi:** [`https://litbang-survey.parokibintaro.org`](https://litbang-survey.parokibintaro.org)

---

## Daftar Isi
1. [Gambaran Umum & Pembagian Peran](#1-gambaran-umum--pembagian-peran)
2. [Langkah 1: Login ke Portal Admin & Litbang](#2-langkah-1-login-ke-portal-admin--litbang)
3. [Langkah 2: Dashboard Utama Manajemen Acara & Misa](#3-langkah-2-dashboard-utama-manajemen-acara--misa)
4. [Langkah 3: Membuat Jadwal Baru & Mengatur Kapasitas Kursi per Ruangan](#4-langkah-3-membuat-jadwal-baru--mengatur-kapasitas-kursi-per-ruangan)
5. [Langkah 4: Membagikan Akses Kiosk ke Petugas Pintu (QR Code)](#5-langkah-4-membagikan-akses-kiosk-ke-petugas-pintu-qr-code)
6. [Langkah 5: Pencatatan Kehadiran oleh Petugas Pintu (Layar Kiosk Mobile)](#6-langkah-5-pencatatan-kehadiran-oleh-petugas-pintu-layar-kiosk-mobile)
7. [Langkah 6: Pemantauan Statistik & Peringatan Kapasitas Real-Time](#7-langkah-6-pemantauan-statistik--peringatan-kapasitas-real-time)
8. [Langkah 7: Menayangkan Layar Videotron / TV Proyektor](#8-langkah-7-menayangkan-layar-videotron--tv-proyektor)
9. [Langkah 8: Catatan Evaluasi, Cetak Laporan PDF, & Unduh Data CSV](#9-langkah-8-catatan-evaluasi-cetak-laporan-pdf--unduh-data-csv)
10. [Langkah 9: Pengelolaan Master Pos Pintu & Gedung (Admin IT)](#10-langkah-9-pengelolaan-master-pos-pintu--gedung-admin-it)
11. [Langkah 10: Manajemen Akun Pengguna (Admin IT)](#11-langkah-10-manajemen-akun-pengguna-admin-it)
12. [Tanya Jawab (FAQ) & Prosedur Kondisi Darurat](#12-tanya-jawab-faq--prosedur-kondisi-darurat)

---

## 1. Gambaran Umum & Pembagian Peran

Aplikasi **Statistik Kehadiran Umat Paroki Bintaro** (`https://litbang-survey.parokibintaro.org`) dirancang untuk membantu **Seksi Penelitian & Pengembangan (Litbang)**, **Tim Tata Tertib (Usher/Kolektan)**, dan **Sekretariat Paroki** dalam menghitung kehadiran umat (baik **Umat Paroki Bintaro** maupun **Umat Luar Paroki**) secara akurat, *real-time*, dan tahan gangguan sinyal (*offline-first*).

| Peran Pengguna | Hak Akses Utama | Perangkat yang Digunakan | Perlu Login? |
| :--- | :--- | :--- | :---: |
| **Petugas Pintu (Usher / Tatib)** | Mencatat ketukan kehadiran umat di pintu masuk & membatalkan ketukan terakhir (*Undo*). | Smartphone / Tablet | **Tidak** (Cukup Scan QR / Buka Tautan Pos) |
| **Tim Litbang** | Membuat jadwal misa/acara, mengatur target kapasitas per ruangan, memantau grafik 5-menit, mengisi evaluasi, serta mengekspor laporan PDF & CSV. | Laptop / PC / Tablet | **Ya** (`litbang@matius.id`) |
| **Tim IT (Admin)** | Seluruh akses Tim Litbang + mengelola Master Pintu Masuk/Gedung dan akun pengguna. | Laptop / PC | **Ya** (`admin@matius.id`) |
| **Operator Videotron** | Menampilkan layar pantau publik/internal di layar TV atau proyektor. | Smart TV / PC Proyektor | **Tidak** (Tautan Publik `/videotron/{id}`) |

---

## 2. Langkah 1: Login ke Portal Admin & Litbang

1. Buka browser (Chrome, Safari, atau Edge) dan kunjungi alamat:  
   **`https://litbang-survey.parokibintaro.org`**
2. Masukkan **Alamat Email** dan **Kata Sandi** sesuai akun yang diberikan oleh Tim IT Paroki:
   - **Tim Litbang:** `litbang@matius.id`
   - **Administrator IT:** `admin@matius.id`
3. Klik tombol **"Masuk ke Dashboard"**.

![Langkah 1 - Halaman Login Portal Statistik Kehadiran Umat](docs/screenshots/01-login-page.png)

---

## 3. Langkah 2: Dashboard Utama Manajemen Acara & Misa

Setelah berhasil masuk, Anda akan diarahkan ke halaman **Manajemen Acara & Misa**. Pada halaman ini terdapat:

- **Ringkasan Statistik Cepat (4 Kartu Atas):** Menampilkan jumlah *Total Acara*, sesi *Sedang Berlangsung (Live)*, sesi *Terjadwal*, dan sesi *Selesai*.
- **Filter Status:** Memudahkan penyaringan acara berdasarkan status (`Semua`, `Live (Open)`, `Terjadwal`, atau `Selesai`).
- **Kartu Acara / Misa:** Setiap kartu menampilkan:
  - Status sesi (`LIVE (OPEN)`, `Terjadwal`, atau `Selesai`).
  - Nama Misa/Kegiatan, jadwal waktu mulai, serta jumlah Pos Pintu aktif.
  - Target kapasitas total kursi beserta jumlah area gedung yang dipantau (misalnya: `850 kursi • 3 area`).
  - **Tautan QR Pos Petugas Masuk:** Deretan tombol cepat untuk memunculkan QR Code tiap pintu.
  - **Tombol Aksi Bawah:** `VideoTron`, `Monitor & Pos`, `PDF`, `CSV`, serta tombol `Buka Sesi` / `Tutup Sesi`.

![Langkah 2 - Dashboard Utama Manajemen Acara & Misa](docs/screenshots/02-admin-dashboard.png)

---

## 4. Langkah 3: Membuat Jadwal Baru & Mengatur Kapasitas Kursi per Ruangan

Untuk menambahkan jadwal Misa Mingguan, Misa Hari Raya (Natal/Paskah), atau kegiatan paroki lainnya:

1. Klik tombol biru **"+ Buat Acara Baru"** di pojok kanan atas dashboard.
2. Isi informasi dasar acara:
   - **Nama Acara / Event:** Contoh: *Misa Hari Raya Paskah - Pk 08:30 WIB*.
   - **Kategori Acara:** Pilih kategori (*Misa*, *Gladi Bersih*, *Pelantikan*, *Seminar*, *Perayaan*, atau *Lainnya*).
   - **Waktu Mulai:** Tentukan tanggal dan jam mulai acara.
   - **Keterangan Tambahan (Opsional):** Catatan untuk panitia atau petugas.
3. **Pilih Pos Pintu Masuk:**
   - Di bagian bawah form, pilih pintu-pintu mana saja yang dibuka pada acara tersebut (dikelompokkan per zona: **Gedung Gereja Utama**, **Gedung Karya Pastoral (GKP)**, dan **Tenda & Selasar Luar**).
   - Anda dapat mengklik **"Pilih Zona Ini"** untuk memilih seluruh pintu pada satu gedung sekaligus.
4. **Aktifkan Peringatan Kapasitas Kursi per Ruangan / Area (Sangat Direkomendasikan):**
   - Centang kotak **"Aktifkan Peringatan Kapasitas Kursi per Ruangan / Area"**.
   - Sistem secara otomatis menampilkan kolom input kapasitas untuk **setiap gedung/ruangan yang dipilih** (misalnya: *Gedung Gereja Utama = 1.200 kursi*, *Gedung Karya Pastoral (GKP) = 300 kursi*, *Tenda & Selasar Luar = 500 kursi*).
   - Total kapasitas gabungan seluruh area akan dihitung otomatis di pojok kanan atas kotak pengaturan kapasitas.
   - Ambang batas peringatan (**$\ge 75\%$ Mendekati Penuh** dan **$\ge 95\%$ Penuh**) akan dievaluasi secara mandiri per ruangan.
5. Klik tombol **"Simpan & Buat Sesi"**.

![Langkah 3 - Modal Buat Acara Baru dan Pengaturan Kapasitas per Ruangan](docs/screenshots/03-create-event-modal.png)

---

## 5. Langkah 4: Membagikan Akses Kiosk ke Petugas Pintu (QR Code)

Petugas pencatat di pintu masuk (**Usher / Tatib**) **tidak perlu memiliki akun atau kata sandi**. Untuk membagikan akses ke smartphone petugas:

1. Pastikan status acara sudah dibuka (**`LIVE (OPEN)`**). Jika masih berstatus *Terjadwal*, klik tombol hijau **"Buka Sesi"** pada kartu acara.
2. Pada bagian **"Tautan QR Pos Petugas Masuk"**, klik nama pintu yang dijaga oleh petugas tersebut (contoh: **`Pintu Utama / Barat`**).
3. Jendela **QR Code Pos Pintu** akan tampil di layar.
4. Petugas cukup memindai (*scan*) QR Code tersebut menggunakan kamera HP, atau koordinator dapat mengklik **"Salin Tautan Pos"** lalu mengirimkannya ke grup WhatsApp petugas.

![Langkah 4 - Modal QR Code untuk Petugas Pintu Masuk](docs/screenshots/04-qr-code-pos.png)

---

## 6. Langkah 5: Pencatatan Kehadiran oleh Petugas Pintu (Layar Kiosk Mobile)

Saat petugas pintu membuka tautan pos (`https://litbang-survey.parokibintaro.org/pos/{token}`) di smartphone mereka:

1. Pastikan nama pintu di bagian atas layar sudah sesuai dengan lokasi jaga petugas (contoh: **Pintu Utama / Barat — Gedung Gereja Utama**).
2. Setiap kali seorang umat melewati pintu masuk, petugas menekan salah satu dari dua tombol besar di layar:
   - Tombol Biru **"UMAT PAROKI BINTARO"** — untuk umat warga Paroki Bintaro.
   - Tombol Kuning/Amber **"UMAT LUAR PAROKI"** — untuk umat tamu atau peziarah dari luar paroki.
3. **Koreksi Kesalahan Ketuk (*Undo*):**
   - Jika tidak sengaja terpencet dua kali, tekan tombol **"Batalkan Ketukan Terakhir (Undo)"** di bagian bawah layar untuk mengurangi 1 hitungan terakhir dari pintu tersebut.
4. **Dukungan Offline Otomatis (*Offline-First*):**
   - Apabila sinyal seluler atau Wi-Fi di area pintu gereja sempat terputus, petugas **tetap dapat menekan tombol seperti biasa**.
   - Ketukan akan disimpan di memori HP (*Antrean Offline*) dan otomatis dikirim ke server begitu koneksi kembali stabil.

![Langkah 5 - Tampilan Layar Kiosk Mobile untuk Petugas Pintu Masuk](docs/screenshots/07-kiosk-mobile.png)

---

## 7. Langkah 6: Pemantauan Statistik & Peringatan Kapasitas Real-Time

Untuk memantau jalannya pencatatan kehadiran secara mendalam dari ruang sekretariat/koordinator:

1. Pada kartu acara di Dashboard Utama, klik tombol **"Monitor & Pos"**.
2. Halaman **Detail & Monitor Acara** akan menampilkan data yang diperbarui otomatis setiap beberapa detik:
   - **Banner Peringatan Kapasitas Ruangan:** Muncul otomatis berwarna **Kuning (Waspada $\ge 75\%$)** atau **Merah Berkedip (Penuh $\ge 95\%$)** beserta nama area gedung yang penuh agar koordinator tatib segera mengarahkan aliran umat ke gedung/tenda cadangan.
   - **4 Kartu Indikator Utama (KPI):** *Total Umat Hadir*, *Umat Paroki Bintaro* (beserta persentase), *Umat Luar Paroki* (beserta persentase), dan *Kapasitas Kursi*.
   - **Distribusi Kehadiran per Gedung & Zona:** Menampilkan keterisian kursi per gedung lengkap dengan indikator progres warna dan badge status (`≥75%` atau `PENUH`).

![Langkah 6a - Dashboard Detail Acara: Banner Kapasitas, KPI, dan Distribusi per Gedung](docs/screenshots/05-event-detail-overview.png)

3. Gulir (*scroll*) ke bagian bawah halaman untuk melihat:
   - **Grafik Lonjakan Kehadiran per 5 Menit:** Menampilkan kurva waktu kedatangan umat dalam interval 5 menit (dapat diubah antara tampilan *Line Chart* atau *Bar Chart*). Sangat berguna untuk mengetahui kapan puncak arus kedatangan umat terjadi (misalnya 15–20 menit sebelum misa dimulai).
   - **Daftar Pos Pintu Aktif & Tambah Pintu Dadakan:** Melihat rincian angka per pintu masuk atau menambahkan pintu/area baru secara langsung jika terjadi lonjakan umat di lapangan.

![Langkah 6b - Grafik Lonjakan Kehadiran per 5 Menit dan Daftar Pos Pintu Masuk](docs/screenshots/06-event-detail-chart-and-doors.png)

---

## 8. Langkah 7: Menayangkan Layar Videotron / TV Proyektor

Aplikasi menyediakan tampilan khusus layar lebar (*dark mode* kontras tinggi) untuk ditayangkan di TV ruang panitia, posko keamanan, atau proyektor:

1. Klik tombol hitam **"VideoTron"** pada kartu acara atau **"Layar VideoTron"** di halaman detail acara.
2. Halaman akan terbuka di alamat `https://litbang-survey.parokibintaro.org/videotron/{event_id}`.
3. Anda dapat memilih mode tampilan di pojok kanan atas:
   - **Split View:** Menampilkan angka raksasa di sisi kiri dan grafik kurva 5-menit di sisi kanan.
   - **Angka Saja:** Fokus pada angka kehadiran berukuran ekstra besar.
   - **Grafik Saja:** Fokus pada grafik tren kedatangan umat.
4. Klik ikon **Layar Penuh (*Fullscreen*)** di pojok kanan atas untuk menyembunyikan bilah alamat browser.
5. Di bagian bawah (*footer*), terdapat rincian per **Gedung / Zona** lengkap dengan persentase kapasitas kursi dan status peringatan (`≥75%` / `PENUH`) serta rincian tiap pintu masuk.

![Langkah 7 - Tampilan Layar Videotron Real-Time](docs/screenshots/08-videotron-display.png)

---

## 9. Langkah 8: Catatan Evaluasi, Cetak Laporan PDF, & Unduh Data CSV

Setelah misa atau kegiatan selesai dilaksanakan, Tim Litbang dapat mendokumentasikan hasil evaluasi dan mengunduh laporan resmi:

1. **Mengunduh Data Mentah Excel (CSV):**
   - Klik tombol **"Download CSV"** pada halaman detail acara (atau tombol **"CSV"** di kartu dashboard).
   - File CSV berisi ringkasan eksekutif, rincian kehadiran per gedung & pintu masuk, distribusi per 5 menit, hingga seluruh log waktu ketukan individual.
2. **Menyusun Catatan Evaluasi & Mencetak Laporan Resmi PDF:**
   - Klik tombol **"Cetak PDF"** pada halaman detail acara.
   - Pada panel kontrol di bagian atas halaman laporan, Tim Litbang dapat:
     - Mengunggah **Foto Dokumentasi Suasana Umat** di lapangan.
     - Menambahkan poin-poin **Observasi Lapangan** berdasarkan kategori (*Tata Ruang*, *Tata Laksana*, *Audio - Visual*, *Parkir & Keamanan*, dll.).
     - Mengisi **Rekomendasi Tindak Lanjut** dan **Kesimpulan Evaluasi**.
   - Klik **"Simpan Evaluasi"** untuk menyimpan catatan ke database.
   - Klik tombol biru **"Cetak / Simpan PDF"** untuk mencetak dokumen ke kertas A4 atau menyimpannya sebagai file PDF resmi ber-kop Gereja St. Matius Penginjil Paroki Bintaro.

![Langkah 8 - Halaman Laporan Eksekutif dan Form Catatan Evaluasi Litbang](docs/screenshots/09-report-print-evaluation.png)

---

## 10. Langkah 9: Pengelolaan Master Pos Pintu & Gedung (Admin IT)

Khusus pengguna dengan peran **TIM IT (ADMIN)**, Anda dapat mengatur daftar standar gedung/zona dan pintu masuk gereja yang akan muncul otomatis setiap kali membuat jadwal baru:

1. Klik menu **"Master Pintu"** pada bilah navigasi atas.
2. Untuk menambahkan pintu baru:
   - Pilih atau ketik nama **Gedung / Zona Area** (contoh: *Gedung Gereja Utama*, *Gedung Karya Pastoral (GKP)*, *Tenda & Selasar Luar*).
   - Masukkan **Nama Pintu / Pos**, **Kode Unik**, **Urutan Tampil**, serta deskripsi lokasi.
   - Klik **"Tambah Master Pos"**.
3. Anda juga dapat mengubah status **Aktif / Nonaktif** atau menghapus pintu yang sudah tidak digunakan.

![Langkah 9 - Halaman Pengelolaan Master Pos Pintu Masuk](docs/screenshots/10-master-pos.png)

---

## 11. Langkah 10: Manajemen Akun Pengguna (Admin IT)

Untuk menambah anggota Tim Litbang baru atau mereset kata sandi pengurus:

1. Klik menu **"Pengguna"** pada bilah navigasi atas.
2. Klik tombol **"+ Tambah Pengguna"** untuk mendaftarkan akun baru:
   - Isi **Nama Lengkap**, **Alamat Email**, **Kata Sandi**, dan pilih **Peran (Role)**: `LITBANG` atau `ADMIN`.
3. Untuk mengganti kata sandi pengguna yang lupa password, klik ikon **Kunci (Reset Password)** pada baris pengguna terkait.

![Langkah 10 - Halaman Manajemen Pengguna Admin dan Litbang](docs/screenshots/11-user-management.png)

---

## 12. Tanya Jawab (FAQ) & Prosedur Kondisi Darurat

### Q1: Bagaimana jika lebih dari satu petugas menjaga pintu yang sama?
**Jawab:** Sangat bisa. Dua atau lebih petugas di pintu yang sama dapat memindai QR Code pintu yang sama di HP masing-masing. Semua ketukan dari HP mereka akan dijumlahkan secara akurat dan *real-time* pada pintu tersebut.

### Q2: Bagaimana jika di tengah Misa dibuka tenda/ruangan tambahan dadakan?
**Jawab:** Koordinator cukup membuka halaman **Monitor & Pos** pada acara yang sedang berlangsung, gulir ke bagian bawah (**"Tambah Pintu / Pos Baru ke Sesi Ini"**), pilih Gedung/Zona, ketik nama pos baru, lalu klik **"+ Tambah Pos"**. QR Code untuk pos baru tersebut langsung siap dipindai oleh petugas.

### Q3: Apa arti warna indikator kapasitas pada gedung/ruangan?
- **Biru / Normal ($< 75\%$):** Kursi di ruangan tersebut masih longgar.
- **Kuning / Waspada ($\ge 75\%$):** Kursi sudah terisi tiga perempat penuh; petugas tatib bersiap mengarahkan umat yang baru datang ke pintu/gedung alternatif.
- **Merah Berkedip / Penuh ($\ge 95\%$):** Ruangan sudah penuh; segera alihkan arus umat ke Gedung Karya Pastoral (GKP) atau Tenda Selasar.

---
*Disusun oleh Tim IT & Seksi Litbang Gereja Santo Matius Penginjil — Paroki Bintaro (2026)*
