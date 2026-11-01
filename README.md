# Akuntansi App

Sistem akuntansi sederhana yang merekam transaksi (jurnal) dan menghasilkan laporan keuangan.
Dibuat untuk tes kemampuan teknis.

**Teknologi:** Laravel 13, React (Inertia, monolitik), MySQL 8.4, dijalankan lewat Laravel Sail (Docker).

## Fitur

- **Login** dengan dua peran: `akuntan` dan `manager`. Pendaftaran publik sengaja dimatikan; akun dibuat lewat seeder.
- **Tambah COA** (daftar akun). Saldo normal (debit/kredit) diisi otomatis dari jenis akun.
- **Input jurnal**: manual lewat form, atau **upload file CSV**.
- **Enam halaman laporan** (bisa dilihat akuntan dan manager, difilter per tanggal):
  Data Transaksi, Buku Besar, Neraca Saldo, Laba Rugi, Neraca, Laporan Posisi Keuangan.

### Hak akses

| | Akuntan | Manager |
|---|---|---|
| Lihat COA dan semua laporan | ya | ya |
| Tambah akun (COA) | ya | tidak (403) |
| Input dan upload jurnal | ya | tidak (403) |

Pembatasan dilakukan di server (middleware `role`), bukan hanya dengan menyembunyikan menu.

## Menjalankan di komputer sendiri

Butuh Docker. Contoh di Linux/WSL:

```bash
git clone <URL-REPO-INI> akuntansi-app
cd akuntansi-app
cp .env.example .env

# pasang dependensi PHP (sekali saja, belum ada vendor/)
docker run --rm -u "$(id -u):$(id -g)" -v "$(pwd):/var/www/html" -w /var/www/html \
  laravelsail/php85-composer:latest composer install --ignore-platform-reqs

./vendor/bin/sail up -d
./vendor/bin/sail artisan key:generate
./vendor/bin/sail artisan migrate --seed
./vendor/bin/sail npm install
./vendor/bin/sail npm run build
```

Buka `http://localhost`.

> Database harus **MySQL** (sudah diatur di `.env.example`). Aturan integritas di database
> memakai CHECK constraint yang tidak didukung SQLite.

### Akun demo

| Peran | Email | Password |
|---|---|---|
| Akuntan | akuntan@example.com | password |
| Manager | manager@example.com | password |

Seeder juga mengisi 18 akun standar (COA) dan 8 jurnal contoh (hanya jika belum ada jurnal),
jadi semua laporan langsung berisi angka. **Ganti password atau hapus akun demo sebelum dipakai sungguhan.**

## Format upload CSV

Header wajib (urutan bebas, pemisah koma atau titik koma):

```
no_jurnal,tanggal,keterangan,kode_akun,debit,kredit
1,2026-11-01,Setoran modal awal,1-100,50000000,
1,2026-11-01,Setoran modal awal,3-100,,50000000
```

- Baris dengan `no_jurnal` sama digabung menjadi satu jurnal (tanggal dan keterangan harus sama).
- `tanggal` berformat `YYYY-MM-DD`. Angka ditulis polos, tanpa titik ribuan (contoh `1500000.50`).
- `kode_akun` harus sudah ada di COA dan aktif.
- **Semua atau tidak sama sekali**: kalau satu baris salah, tidak ada jurnal yang disimpan dan
  pesan error menyebut nomor barisnya.
- Nomor jurnal sistem (`JU-0001`, dst.) dibuat otomatis; `no_jurnal` di file hanya untuk pengelompokan.
- Contoh file: `public/contoh-jurnal.csv` (juga ada tombol unduh di halaman Input Jurnal).

## Aturan akuntansi yang ditegakkan

1. Jurnal harus seimbang (total debit = total kredit), minimal 2 baris, dan tiap baris hanya debit **atau** kredit.
2. Penyimpanan jurnal memakai transaksi database (semua atau tidak sama sekali).
3. Uang disimpan sebagai `decimal(18,2)`; perhitungan memakai bilangan bulat (sen), bukan float.
4. Laporan **dihitung dari tabel `journal_lines`**, tidak disimpan terpisah.
5. Neraca Saldo, Neraca, dan Posisi Keuangan dihitung "per tanggal" (kumulatif). Buku Besar, Laba Rugi,
   dan Data Transaksi dihitung per rentang tanggal.
6. Neraca memasukkan laba/rugi berjalan ke ekuitas, sehingga Aset = Kewajiban + Ekuitas.
7. Database punya CHECK constraint: debit/kredit tidak negatif, tidak boleh keduanya terisi, dan tidak boleh keduanya nol.

## Tes otomatis

```bash
./vendor/bin/sail artisan test
```

Tes memakai database MySQL bernama `testing` (dibuat otomatis oleh Sail). Mencakup: jurnal seimbang/tidak,
upload CSV (semua atau tidak sama sekali), hak akses per peran (403), kode akun unik, CHECK constraint,
dan perhitungan semua laporan.

## Yang belum ada (jujur)

- Jurnal tidak bisa diedit/dihapus lewat aplikasi, tetapi **fitur jurnal pembalik belum dibuat**.
- Belum ada tutup periode/tutup buku, export PDF/Excel, dan import `.xlsx` (hanya CSV).
- Belum ada fitur menonaktifkan akun lewat tampilan (kolom `is_active` sudah ada dan dihormati).
- Tidak ada multi mata uang, pajak, rekonsiliasi bank, invoice, maupun stok.
- Hak akses manager (hanya melihat) adalah keputusan desain; soal tidak menyebutnya secara eksplisit.
