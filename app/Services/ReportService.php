<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Semua laporan dihitung langsung dari tabel journal_lines.
 * Angka dihitung dalam "sen" (bilangan bulat) supaya tidak ada error pecahan.
 */
class ReportService
{
    private const CATEGORY_TYPE = [
        'aset lancar' => 'aset',
        'aset tidak lancar' => 'aset',
        'kewajiban jangka pendek' => 'kewajiban',
        'kewajiban jangka panjang' => 'kewajiban',
        'ekuitas' => 'ekuitas',
    ];

    private static function c(mixed $v): int
    {
        return JournalService::cents($v);
    }

    private static function m(int $cents): float
    {
        return $cents / 100;
    }

    /** Total debit dan kredit per akun untuk rentang tanggal tertentu. */
    private function totals(?string $from, ?string $to): array
    {
        $rows = DB::table('accounts as a')
            ->join('journal_lines as l', 'l.account_id', '=', 'a.id')
            ->join('journals as j', 'j.id', '=', 'l.journal_id')
            ->when($from, fn ($q) => $q->where('j.date', '>=', $from))
            ->when($to, fn ($q) => $q->where('j.date', '<=', $to))
            ->groupBy('a.id', 'a.code', 'a.name', 'a.type', 'a.category', 'a.normal_balance')
            ->orderBy('a.code')
            ->selectRaw('a.id, a.code, a.name, a.type, a.category, a.normal_balance, SUM(l.debit) as debit, SUM(l.credit) as credit')
            ->get();

        return $rows->map(fn ($r) => [
            'id' => $r->id,
            'code' => $r->code,
            'name' => $r->name,
            'type' => $r->type,
            'category' => $r->category,
            'normal' => $r->normal_balance,
            'd' => self::c($r->debit),
            'c' => self::c($r->credit),
        ])->all();
    }

    /** Saldo akun menurut sisi normalnya (aset/beban = debit, lainnya = kredit). */
    private function signed(array $r): int
    {
        return $r['normal'] === 'debit' ? $r['d'] - $r['c'] : $r['c'] - $r['d'];
    }

    public function trialBalance(string $to): array
    {
        $rows = [];
        $totalDebit = 0;
        $totalCredit = 0;

        foreach ($this->totals(null, $to) as $r) {
            $net = $r['d'] - $r['c'];
            $debit = max($net, 0);
            $credit = max(-$net, 0);

            if ($debit === 0 && $credit === 0) {
                continue;
            }

            $rows[] = [
                'code' => $r['code'],
                'name' => $r['name'],
                'debit' => self::m($debit),
                'credit' => self::m($credit),
            ];
            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        return [
            'rows' => $rows,
            'total_debit' => self::m($totalDebit),
            'total_credit' => self::m($totalCredit),
            'balanced' => $totalDebit === $totalCredit,
        ];
    }

    public function incomeStatement(string $from, string $to): array
    {
        $revenues = [];
        $expenses = [];
        $totalRevenue = 0;
        $totalExpense = 0;

        foreach ($this->totals($from, $to) as $r) {
            $bal = $this->signed($r);
            $row = ['code' => $r['code'], 'name' => $r['name'], 'amount' => self::m($bal)];

            if ($r['type'] === 'pendapatan') {
                $revenues[] = $row;
                $totalRevenue += $bal;
            } elseif ($r['type'] === 'beban') {
                $expenses[] = $row;
                $totalExpense += $bal;
            }
        }

        return [
            'revenues' => $revenues,
            'expenses' => $expenses,
            'total_revenue' => self::m($totalRevenue),
            'total_expense' => self::m($totalExpense),
            'net_income' => self::m($totalRevenue - $totalExpense),
        ];
    }

    /** Dipakai halaman Neraca dan Laporan Posisi Keuangan. */
    public function balanceSheet(string $to): array
    {
        $groups = [];
        foreach (self::CATEGORY_TYPE as $cat => $type) {
            $groups[$cat] = ['category' => $cat, 'type' => $type, 'accounts' => [], 'cents' => 0];
        }

        $earnings = 0;

        foreach ($this->totals(null, $to) as $r) {
            $bal = $this->signed($r);

            if ($r['type'] === 'pendapatan') {
                $earnings += $bal;
            } elseif ($r['type'] === 'beban') {
                $earnings -= $bal;
            } else {
                $groups[$r['category']]['accounts'][] = [
                    'code' => $r['code'],
                    'name' => $r['name'],
                    'amount' => self::m($bal),
                ];
                $groups[$r['category']]['cents'] += $bal;
            }
        }

        // Laba/rugi berjalan masuk ke ekuitas supaya Aset = Kewajiban + Ekuitas
        $groups['ekuitas']['accounts'][] = [
            'code' => '',
            'name' => 'Laba (rugi) berjalan',
            'amount' => self::m($earnings),
        ];
        $groups['ekuitas']['cents'] += $earnings;

        $sum = fn (string $type) => array_sum(array_column(
            array_filter($groups, fn ($g) => $g['type'] === $type),
            'cents'
        ));
        $assets = $sum('aset');
        $liabilities = $sum('kewajiban');
        $equity = $sum('ekuitas');

        return [
            'groups' => array_values(array_map(fn ($g) => [
                'category' => $g['category'],
                'type' => $g['type'],
                'accounts' => $g['accounts'],
                'subtotal' => self::m($g['cents']),
            ], $groups)),
            'total_assets' => self::m($assets),
            'total_liabilities' => self::m($liabilities),
            'total_equity' => self::m($equity),
            'balanced' => $assets === $liabilities + $equity,
        ];
    }

    public function generalLedger(string $from, string $to, ?int $accountId): array
    {
        $accounts = [];

        // Saldo awal = saldo semua transaksi sebelum tanggal "dari"
        $before = Carbon::parse($from)->subDay()->toDateString();
        foreach ($this->totals(null, $before) as $r) {
            if ($accountId && $r['id'] !== $accountId) {
                continue;
            }
            $accounts[$r['id']] = [
                'code' => $r['code'],
                'name' => $r['name'],
                'normal' => $r['normal'],
                'opening' => $this->signed($r),
                'lines' => [],
            ];
        }

        $lines = DB::table('journal_lines as l')
            ->join('journals as j', 'j.id', '=', 'l.journal_id')
            ->join('accounts as a', 'a.id', '=', 'l.account_id')
            ->where('j.date', '>=', $from)
            ->where('j.date', '<=', $to)
            ->when($accountId, fn ($q) => $q->where('a.id', $accountId))
            ->orderBy('a.code')->orderBy('j.date')->orderBy('j.id')->orderBy('l.id')
            ->get([
                'a.id as account_id', 'a.code', 'a.name', 'a.normal_balance',
                'j.date', 'j.number', 'j.description', 'l.debit', 'l.credit',
            ]);

        foreach ($lines as $l) {
            $accounts[$l->account_id] ??= [
                'code' => $l->code,
                'name' => $l->name,
                'normal' => $l->normal_balance,
                'opening' => 0,
                'lines' => [],
            ];
            $accounts[$l->account_id]['lines'][] = $l;
        }

        uasort($accounts, fn ($x, $y) => strnatcmp($x['code'], $y['code']));

        $result = [];
        foreach ($accounts as $a) {
            $bal = $a['opening'];
            $totalDebit = 0;
            $totalCredit = 0;
            $rows = [];

            foreach ($a['lines'] as $l) {
                $d = self::c($l->debit);
                $k = self::c($l->credit);
                $bal += $a['normal'] === 'debit' ? $d - $k : $k - $d;
                $totalDebit += $d;
                $totalCredit += $k;
                $rows[] = [
                    'date' => $l->date,
                    'number' => $l->number,
                    'description' => $l->description,
                    'debit' => self::m($d),
                    'credit' => self::m($k),
                    'balance' => self::m($bal),
                ];
            }

            $result[] = [
                'code' => $a['code'],
                'name' => $a['name'],
                'normal' => $a['normal'],
                'opening' => self::m($a['opening']),
                'rows' => $rows,
                'total_debit' => self::m($totalDebit),
                'total_credit' => self::m($totalCredit),
                'closing' => self::m($bal),
            ];
        }

        return $result;
    }
}
