# Akuntansi App — Sistem Akuntansi & Pelaporan Keuangan

Sistem akuntansi monolitik modern untuk mencatat transaksi jurnal dan menghasilkan laporan keuangan secara otomatis dan akurat. Dibangun sebagai bagian dari tes teknis dengan fokus pada **integritas data, kebenaran akuntansi, dan keamanan role**.

> Stack: **Laravel 13 + React 19 + Inertia.js 2 + MySQL 8.4 + TypeScript**

**Live Demo (Production):** http://103.67.244.78  
**Repository:** https://github.com/zyaaan66/akuntansi-app  
**VPS:** DomaiNesia Cloud VPS Lite 1GB — Jakarta (Ubuntu 24.04 LTS, PHP 8.4.27, Nginx, MySQL 8.4)

---

## Daftar Isi

- [Gambaran Umum](#gambaran-umum)
- [Fitur Utama](#fitur-utama)
- [Struktur Menu](#struktur-menu)
- [Tech Stack](#tech-stack)
- [Arsitektur & Alur Data](#arsitektur--alur-data)
- [Hak Akses & Keamanan](#hak-akses--keamanan)
- [Instalasi Lokal](#instalasi-lokal---docker--wsl)
- [Instalasi Production VPS](#instalasi-production-vps---ubuntu-2404)
- [Akun Demo](#akun-demo)
- [Format Upload CSV](#format-upload-csv)
- [Aturan Akuntansi yang Ditegakkan](#aturan-akuntansi-yang-ditegakkan)
- [Tes Otomatis](#tes-otomatis)
- [Deployment yang Sudah Dilakukan](#deployment-yang-sudah-dilakukan)
- [Keterbatasan & Roadmap](#keterbatasan--roadmap)
- [Lisensi](#lisensi)

---

## Gambaran Umum

Aplikasi ini bukan sekadar CRUD. Tujuannya adalah memastikan setiap transaksi jurnal **seimbang**, **atomik**, dan **dapat dipertanggungjawabkan**, serta semua laporan keuangan **dihitung real-time** dari data transaksi, bukan disimpan terpisah.

**Masalah yang diselesaikan:**
- Input jurnal manual rawan tidak seimbang (debit != kredit)
- Upload CSV massal rawan sebagian masuk sebagian gagal
- Laporan keuangan sering tidak konsisten karena dihitung terpisah
- Hak akses manager yang seharusnya read-only sering hanya di-hide di frontend

**Solusi di aplikasi ini:**
- Validasi seimbang di level Request, Service, dan Database CHECK constraint
- Upload CSV atomic dengan transaksi DB (semua berhasil atau semua dibatalkan) + laporan baris error
- Semua laporan dihitung dari `journal_lines` secara live, Neraca selalu seimbang Aset = Kewajiban + Ekuitas
- Middleware role di server (403), bukan hanya hide menu

---

## Fitur Utama

### 1. Dashboard Keuangan
- Ringkasan: Kas dan Bank, Total Aset, Pendapatan, Beban, Laba Bersih
- Filter per Bulan (contoh: Oktober 2026)
- Validasi real-time: `Neraca seimbang: neraca saldo seimbang dan Aset = Kewajiban + Ekuitas`
- Grafik Pendapatan vs Beban 6 bulan terakhir
- List Jurnal terbaru

### 2. Data Master - Akun (COA)
- CRUD Chart of Accounts
- 18 akun standar sudah tersedia via seeder: Kas, Bank, Piutang Usaha, Persediaan, Peralatan, Akumulasi Penyusutan, Hutang Usaha, Modal, Pendapatan Jasa, Beban Gaji, dll.
- Saldo normal (Debit/Kredit) otomatis dari jenis akun: Aset & Beban = Debit, Kewajiban + Ekuitas + Pendapatan = Kredit
- Mendukung parent-child (akun induk dan anak)
- Validasi kode akun unik, tidak boleh duplikat
- Kolom `is_active` sudah ada dan dihormati (untuk non-aktifkan akun di masa depan)

### 3. Transaksi

#### a. Jurnal Masukan (Input Jurnal)
- Form manual: tambah baris dinamis, pilih kode akun dari COA, isi debit atau kredit (tidak boleh keduanya)
- Validasi: minimal 2 baris, total debit harus = total kredit, tanggal wajib, keterangan wajib
- Nomor jurnal sistem otomatis: `JU-0001`, `JU-0002`, dst. (no_jurnal di CSV hanya untuk grouping)
- Tombol download contoh CSV

#### b. Transaksi Data
- List semua jurnal dengan pagination
- Filter per rentang tanggal
- Detail: tanggal, keterangan, kode akun, nama akun, debit, kredit
- Siap untuk audit

### 4. Laporan Keuangan (6 Laporan)

Semua laporan bisa dilihat oleh Akuntan dan Manager, bisa difilter per tanggal / per bulan:

| Laporan | Jenis Hitungan | Deskripsi |
|---------|---------------|-----------|
| **Data Transaksi** | Per rentang tanggal | List transaksi mentah |
| **Buku Besar** | Per rentang tanggal | Pergerakan per akun COA |
| **Neraca Saldo** | Kumulatif per tanggal | Total debit/kredit per akun, harus seimbang |
| **Laba Rugi** | Per rentang tanggal | Pendapatan - Beban = Laba Bersih |
| **Neraca** | Kumulatif per tanggal | Aset = Kewajiban + Ekuitas, laba berjalan masuk ke ekuitas |
| **Posisi Keuangan** | Kumulatif per tanggal | Ringkasan posisi aset, kewajiban, ekuitas |

Semua laporan dihitung dari tabel `journal_lines`, bukan disimpan terpisah. Ini memastikan konsistensi.

---

## Struktur Menu

Sesuai dengan sidebar aplikasi saat ini:

```
Utama
- Dasbor

Data Master
- Akun (COA)

Transaksi
- Jurnal Masukan
- Transaksi Data

Laporan
- Buku Besar
- Neraca Saldo
- Laba Rugi
- Neraca
- Posisi Keuangan
```

---

## Tech Stack

**Backend:**
- Laravel 13.39 (PHP 8.4.27 required - Symfony 8.1)
- Inertia.js 2.0 (monolitik, tidak pisah API)
- MySQL 8.4 dengan CHECK constraints
- Eloquent ORM, Form Request Validation, Service Layer

**Frontend:**
- React 19, TypeScript 5.9
- Vite 7 + @laravel/vite-plugin-wayfinder
- TailwindCSS 4, shadcn/ui components
- pnpm sebagai package manager

**DevOps & Tools:**
- Laravel Sail (Docker) untuk lokal - MySQL 8.4, PHP 8.4
- Laravel Pint (code formatter), PHPStan (static analysis)
- Git + GitHub - commit per fitur (feat, fix, style, docs)
- Nginx + PHP-FPM 8.4 di Production
- DomaiNesia Cloud VPS Lite 1GB - Jakarta, Ubuntu 24.04 LTS

---

## Arsitektur & Alur Data

```
[Browser - React] 
   -> Inertia Request 
   -> Laravel Controller (role middleware) 
   -> FormRequest (validasi) 
   -> Service (logika bisnis + transaksi DB) 
   -> Model (Eloquent) 
   -> MySQL (dengan CHECK constraints)
   -> Response Inertia -> React Page
```

- **Jurnal:** Header di `journals` (id, nomor JU-xxxx, tanggal, keterangan), detail di `journal_lines` (account_id, debit, credit)
- **COA:** `accounts` dengan kode unik, jenis, saldo normal, parent_id, is_active
- **Laporan:** Query agregasi dari `journal_lines` join `accounts`, tidak ada tabel laporan terpisah

---

## Hak Akses & Keamanan

| Aksi | Akuntan | Manager |
|------|---------|---------|
| Lihat Dashboard | ✅ | ✅ |
| Lihat COA | ✅ | ✅ |
| Tambah/Edit COA | ✅ | ❌ 403 Forbidden |
| Input Jurnal Manual | ✅ | ❌ 403 Forbidden |
| Upload Jurnal CSV | ✅ | ❌ 403 Forbidden |
| Lihat Semua Laporan + Filter | ✅ | ✅ |

- Middleware `role:akuntan` dan `role:manager` di level route
- Validasi di server, bukan hanya hide menu di React
- CSRF protection, XSS protection bawaan Laravel + React
- Password di-hash bcrypt, APP_KEY untuk enkripsi

---

## Instalasi Lokal - Docker / WSL

Prasyarat: Docker Desktop / Docker Engine + WSL2 (jika di Windows)

```bash
# 1. Clone
git clone https://github.com/zyaaan66/akuntansi-app.git
cd akuntansi-app

# 2. Copy env
cp .env.example .env

# 3. Install vendor PHP tanpa butuh PHP lokal (pakai Sail image)
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html   laravelsail/php84-composer:latest composer install --ignore-platform-reqs

# 4. Up Sail (MySQL 8.4 + PHP 8.4 + Node)
./vendor/bin/sail up -d

# 5. Setup Laravel
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail pnpm install
./vendor/bin/sail pnpm run build

# 6. Buka
http://localhost
```

Database harus MySQL 8.4 karena ada CHECK constraints yang tidak didukung SQLite.

---

## Instalasi Production VPS - Ubuntu 24.04

Ini yang dipakai di live demo http://103.67.244.78

```bash
# Update & install dependencies
apt update && apt install -y software-properties-common
add-apt-repository ppa:ondrej/php -y
apt update
apt install -y php8.4 php8.4-fpm php8.4-mysql php8.4-mbstring php8.4-xml php8.4-curl php8.4-zip php8.4-bcmath php8.4-gd php8.4-cli unzip git curl nginx mysql-server nodejs
curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
npm install -g pnpm

# MySQL setup
mysql -u root -e "CREATE DATABASE akuntansi_db; CREATE USER 'akuntansi'@'localhost' IDENTIFIED BY 'Akuntansi2026'; GRANT ALL PRIVILEGES ON akuntansi_db.* TO 'akuntansi'@'localhost'; FLUSH PRIVILEGES;"

# Clone & setup
cd /var/www
git clone https://github.com/zyaaan66/akuntansi-app.git
cd akuntansi-app
export COMPOSER_ALLOW_SUPERUSER=1
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
# Edit .env: DB_HOST=127.0.0.1, DB_DATABASE=akuntansi_db, DB_USERNAME=akuntansi, DB_PASSWORD=Akuntansi2026, APP_URL=http://IP_VPS
pnpm install
pnpm run build
php artisan migrate --seed --force
php artisan storage:link
chown -R www-data:www-data /var/www/akuntansi-app
chmod -R 775 storage bootstrap/cache

# Nginx - arahkan root ke /public
# Buat file /etc/nginx/sites-available/akuntansi-app dengan server_name IP dan root /var/www/akuntansi-app/public
# ln -s dan restart nginx + php8.4-fpm
```

---

## Akun Demo

Seeder otomatis membuat akun demo. **Ganti password sebelum production!**

| Peran | Email | Password | Keterangan |
|-------|-------|----------|------------|
| Akuntan | akuntan@example.com | password | Full akses |
| Manager | manajer@contoh.com | password | Read-only |

Seeder tambahan:
- 18 akun COA standar (Kas 1-100, Bank 1-101, Piutang 1-200, dst. sampai Beban)
- 8 jurnal contoh (Setoran modal, Beli peralatan, Pendapatan jasa, Bayar gaji, dll.) - hanya jika belum ada jurnal, jadi laporan langsung ada angkanya

---

## Format Upload CSV

Contoh file tersedia di `public/contoh-jurnal.csv` dan ada tombol download di halaman Jurnal Masukan.

**Header wajib** (urutan bebas, pemisah koma `,` atau titik koma `;`):

```
no_jurnal,tanggal,keterangan,kode_akun,debit,kredit
1,2026-11-01,Setoran modal awal,1-100,50000000,
1,2026-11-01,Setoran modal awal,3-100,,50000000
2,2026-11-02,Beli peralatan kantor,1-400,10000000,
2,2026-11-02,Beli peralatan kantor,1-100,,10000000
```

**Aturan Upload:**
1. Baris dengan `no_jurnal` sama digabung menjadi 1 jurnal (tanggal dan keterangan harus sama persis)
2. `tanggal` format YYYY-MM-DD
3. Angka polos tanpa titik ribuan, desimal pakai titik: `1500000.50`
4. `kode_akun` harus sudah ada di COA dan `is_active = true`
5. **Atomic:** Jika 1 baris salah, tidak ada jurnal yang disimpan sama sekali + pesan error menyebutkan nomor baris dan alasannya
6. Nomor jurnal sistem `JU-0001` dst. dibuat otomatis, `no_jurnal` di file hanya untuk pengelompokan
7. Validasi seimbang tetap berlaku: total debit = total kredit per jurnal

---

## Aturan Akuntansi yang Ditegakkan

1.  **Jurnal seimbang:** Total debit = total kredit, minimal 2 baris, tiap baris hanya debit ATAU kredit (tidak boleh keduanya terisi atau keduanya nol)
2.  **Transaksi DB:** Penyimpanan jurnal menggunakan `DB::transaction` (all or nothing)
3.  **Presisi uang:** Disimpan `decimal(18,2)`, perhitungan menggunakan integer sen (bukan float) untuk hindari floating error
4.  **Laporan real-time:** Dihitung dari `journal_lines`, tidak disimpan terpisah
5.  **Jenis perhitungan:**
    - Neraca Saldo, Neraca, Posisi Keuangan = kumulatif per tanggal (sampai tanggal filter)
    - Buku Besar, Laba Rugi, Data Transaksi = per rentang tanggal (dari - sampai)
6.  **Neraca seimbang:** Laba/rugi berjalan otomatis masuk ke ekuitas, sehingga `Aset = Kewajiban + Ekuitas` selalu
7.  **CHECK constraints di DB:** `debit >=0`, `kredit >=0`, `NOT (debit>0 AND kredit>0)`, `NOT (debit=0 AND kredit=0)` - jadi validasi tidak hanya di aplikasi tapi di database juga

---

## Tes Otomatis

```bash
./vendor/bin/sail artisan test
# atau di VPS
php artisan test
```

Tes menggunakan database MySQL `testing` (dibuat otomatis Sail).

**Cakupan tes:**
- Jurnal seimbang vs tidak seimbang (harus ditolak)
- Upload CSV atomic (1 baris salah = semua batal)
- Hak akses role (manager tidak boleh POST COA / jurnal - harus 403)
- Kode akun unik (tidak boleh duplikat)
- CHECK constraints di DB
- Perhitungan semua 6 laporan (apakah laba rugi benar, neraca seimbang)

---

## Deployment yang Sudah Dilakukan

- **Repo:** https://github.com/zyaaan66/akuntansi-app - 10+ commit per fitur (feat, fix, style, docs)
- **VPS:** DomaiNesia Cloud VPS Lite 1GB - 103.67.244.78 - Jakarta - Rp 53.280/bulan
- **OS:** Ubuntu 24.04 LTS
- **Stack Production:** PHP 8.4.27, Nginx, MySQL 8.4, Node 20, pnpm
- **Build:** `pnpm run build` menghasilkan assets di `public/build`
- **Live:** http://103.67.244.78 - Sudah bisa login, dashboard menampilkan Rp 164.5jt total aset, neraca seimbang

---

## Keterbatasan & Roadmap

**Yang belum ada (jujur):**

- [ ] Edit/hapus jurnal via UI (baru ada kolom `reversal_of` untuk pembalikan, belum ada UI)
- [ ] Tutup buku / closing period per bulan/tahun
- [ ] Export laporan ke PDF / Excel (baru tampil di web + CSV)
- [ ] Import `.xlsx` (baru CSV)
- [ ] Non-aktifkan akun COA via UI (kolom `is_active` sudah ada dan dihormati di validasi)
- [ ] Multi mata uang, pajak PPN, rekonsiliasi bank, invoice, stok barang
- [ ] Audit log siapa yang input jurnal

**Hak akses manager read-only adalah keputusan desain** karena soal tes tidak menyebutkan eksplisit, tapi demi keamanan data akuntansi.

---

## Lisensi

Private project untuk tes teknis magang / junior. Tidak untuk production tanpa review keamanan lebih lanjut (rate limiting, 2FA, backup otomatis, dll.)

**Author:** Sofyan, Gamping, Sleman, Yogyakarta  
**Kontak:** trisfn03@gmail.com  
**Tanggal:** 3 November 2026

---

> Jika ada yang ingin ditanyakan tentang alur akuntansi atau cara deploy, silakan buat Issue di GitHub.
