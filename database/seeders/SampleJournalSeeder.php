<?php

namespace Database\Seeders;

use App\Models\Account;
use App\Models\Journal;
use App\Models\User;
use App\Services\JournalService;
use Illuminate\Database\Seeder;

/** Jurnal contoh supaya semua laporan langsung berisi angka. Dilewati kalau sudah ada jurnal. */
class SampleJournalSeeder extends Seeder
{
    public function run(JournalService $service): void
    {
        $user = User::where('email', 'akuntan@example.com')->first();

        if (! $user || Journal::exists()) {
            return;
        }

        $ids = Account::pluck('id', 'code');

        $contoh = [
            ['2026-10-01', 'Setoran modal awal', '1-100', '3-100', 100000000],
            ['2026-10-03', 'Beli peralatan tunai', '1-200', '1-100', 20000000],
            ['2026-10-05', 'Pinjaman dari bank', '1-110', '2-200', 50000000],
            ['2026-10-10', 'Penjualan tunai', '1-100', '4-200', 15000000],
            ['2026-10-15', 'Pendapatan jasa (belum dibayar)', '1-120', '4-100', 8000000],
            ['2026-10-20', 'Bayar gaji karyawan', '5-100', '1-100', 6000000],
            ['2026-10-25', 'Bayar sewa kantor', '5-110', '1-100', 2500000],
            ['2026-10-28', 'Beli perlengkapan (utang)', '5-130', '2-100', 1200000],
        ];

        foreach ($contoh as [$tanggal, $ket, $debit, $kredit, $jumlah]) {
            $service->create([
                'date' => $tanggal,
                'description' => $ket,
                'lines' => [
                    ['account_id' => $ids[$debit], 'debit' => $jumlah, 'credit' => 0],
                    ['account_id' => $ids[$kredit], 'debit' => 0, 'credit' => $jumlah],
                ],
            ], 'manual', $user->id);
        }
    }
}
