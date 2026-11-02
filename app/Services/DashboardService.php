<?php

namespace App\Services;

use App\Models\Journal;
use Carbon\Carbon;

/**
 * Angka dashboard. Semua dihitung lewat ReportService (dari journal_lines),
 * jadi angkanya pasti sama dengan halaman laporan.
 */
class DashboardService
{
    /** Kode akun kas dan bank (sesuai seeder COA standar). */
    private const CASH_CODES = ['1-100', '1-110'];

    public function __construct(private ReportService $reports) {}

    public function summary(?string $month): array
    {
        $latest = Journal::max('date');

        // Bulan yang ditampilkan: pilihan pengguna; kalau kosong, bulan jurnal terakhir
        $base = $month
            ? Carbon::createFromFormat('!Y-m', $month)
            : ($latest ? Carbon::parse($latest)->startOfMonth() : now()->startOfMonth());

        $from = $base->copy()->startOfMonth()->toDateString();
        $to = $base->copy()->endOfMonth()->toDateString();

        $income = $this->reports->incomeStatement($from, $to);
        $sheet = $this->reports->balanceSheet($to);

        $cash = 0.0;
        foreach ($sheet['groups'] as $group) {
            foreach ($group['accounts'] as $account) {
                if (in_array($account['code'], self::CASH_CODES, true)) {
                    $cash += $account['amount'];
                }
            }
        }

        // Pemeriksaan keseimbangan memakai seluruh jurnal yang ada
        $end = max(now()->toDateString(), $latest ?? now()->toDateString());
        $balanced = $this->reports->trialBalance($end)['balanced']
            && $this->reports->balanceSheet($end)['balanced'];

        // Grafik: 6 bulan sampai bulan yang dipilih
        $chart = [];
        for ($i = 5; $i >= 0; $i--) {
            $m = $base->copy()->subMonths($i);
            $r = $this->reports->incomeStatement(
                $m->copy()->startOfMonth()->toDateString(),
                $m->copy()->endOfMonth()->toDateString(),
            );
            $chart[] = [
                'month' => $m->format('Y-m'),
                'revenue' => $r['total_revenue'],
                'expense' => $r['total_expense'],
            ];
        }

        $recent = Journal::withSum('lines', 'debit')
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->limit(5)
            ->get()
            ->map(fn (Journal $j) => [
                'id' => $j->id,
                'number' => $j->number,
                'date' => $j->date->format('Y-m-d'),
                'description' => $j->description,
                'amount' => (float) $j->lines_sum_debit,
            ])
            ->all();

        return [
            'month' => $base->format('Y-m'),
            'as_of' => $to,
            'kpi' => [
                'cash' => round($cash, 2),
                'assets' => $sheet['total_assets'],
                'revenue' => $income['total_revenue'],
                'expense' => $income['total_expense'],
                'net_income' => $income['net_income'],
            ],
            'balanced' => $balanced,
            'chart' => $chart,
            'recent' => $recent,
        ];
    }
}
