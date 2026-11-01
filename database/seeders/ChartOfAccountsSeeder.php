<?php

namespace Database\Seeders;

use App\Models\Account;
use Illuminate\Database\Seeder;

class ChartOfAccountsSeeder extends Seeder
{
    public function run(): void
    {
        $daftar = [
            ['1-100', 'Kas', 'aset', 'aset lancar'],
            ['1-110', 'Bank', 'aset', 'aset lancar'],
            ['1-120', 'Piutang Usaha', 'aset', 'aset lancar'],
            ['1-130', 'Persediaan', 'aset', 'aset lancar'],
            ['1-200', 'Peralatan', 'aset', 'aset tidak lancar'],
            ['1-210', 'Kendaraan', 'aset', 'aset tidak lancar'],
            ['2-100', 'Utang Usaha', 'kewajiban', 'kewajiban jangka pendek'],
            ['2-110', 'Utang Gaji', 'kewajiban', 'kewajiban jangka pendek'],
            ['2-200', 'Utang Bank', 'kewajiban', 'kewajiban jangka panjang'],
            ['3-100', 'Modal Pemilik', 'ekuitas', 'ekuitas'],
            ['3-200', 'Laba Ditahan', 'ekuitas', 'ekuitas'],
            ['4-100', 'Pendapatan Jasa', 'pendapatan', 'pendapatan'],
            ['4-200', 'Pendapatan Penjualan', 'pendapatan', 'pendapatan'],
            ['5-100', 'Beban Gaji', 'beban', 'beban'],
            ['5-110', 'Beban Sewa', 'beban', 'beban'],
            ['5-120', 'Beban Listrik dan Air', 'beban', 'beban'],
            ['5-130', 'Beban Perlengkapan', 'beban', 'beban'],
            ['5-140', 'Beban Lain-lain', 'beban', 'beban'],
        ];

        foreach ($daftar as [$kode, $nama, $jenis, $kelompok]) {
            Account::updateOrCreate(
                ['code' => $kode],
                [
                    'name' => $nama,
                    'type' => $jenis,
                    'category' => $kelompok,
                    'normal_balance' => Account::NORMAL_BALANCE[$jenis],
                    'is_active' => true,
                ]
            );
        }
    }
}
