<?php

namespace App\Services;

use App\Models\Journal;
use Illuminate\Support\Facades\DB;

class JournalService
{
    /** Ubah angka rupiah ke sen (bilangan bulat) supaya perbandingan tidak kena error pecahan. */
    public static function cents(mixed $value): int
    {
        return (int) round(((float) ($value ?? 0)) * 100);
    }

    /**
     * Cek aturan jurnal. Mengembalikan pesan error, atau null kalau semua benar.
     * Aturan: minimal 2 baris, tiap baris hanya debit ATAU kredit (> 0), total debit = total kredit.
     */
    public static function checkLines(array $lines): ?string
    {
        if (count($lines) < 2) {
            return 'Jurnal minimal punya 2 baris.';
        }

        $totalDebit = 0;
        $totalCredit = 0;

        foreach (array_values($lines) as $i => $line) {
            $debit = self::cents($line['debit'] ?? 0);
            $credit = self::cents($line['credit'] ?? 0);
            $no = $i + 1;

            if ($debit > 0 && $credit > 0) {
                return "Baris {$no}: isi debit atau kredit saja, tidak boleh keduanya.";
            }
            if ($debit <= 0 && $credit <= 0) {
                return "Baris {$no}: debit atau kredit harus lebih dari 0.";
            }

            $totalDebit += $debit;
            $totalCredit += $credit;
        }

        if ($totalDebit !== $totalCredit) {
            return 'Jurnal tidak seimbang. Total debit '
                .number_format($totalDebit / 100, 2, ',', '.')
                .', total kredit '
                .number_format($totalCredit / 100, 2, ',', '.').'.';
        }

        return null;
    }

    /** Simpan satu jurnal beserta barisnya (semua atau tidak sama sekali). */
    public function create(array $data, string $source, int $userId): Journal
    {
        return DB::transaction(fn () => $this->store($data, $source, $userId));
    }

    /** Simpan banyak jurnal sekaligus dalam SATU transaksi database. */
    public function createMany(array $journals, string $source, int $userId): int
    {
        return DB::transaction(function () use ($journals, $source, $userId) {
            foreach ($journals as $data) {
                $this->store($data, $source, $userId);
            }

            return count($journals);
        });
    }

    private function store(array $data, string $source, int $userId): Journal
    {
        $error = self::checkLines($data['lines']);
        if ($error !== null) {
            throw new \InvalidArgumentException($error);
        }

        $journal = Journal::create([
            'number' => $this->nextNumber(),
            'date' => $data['date'],
            'description' => $data['description'],
            'source' => $source,
            'created_by' => $userId,
        ]);

        foreach ($data['lines'] as $line) {
            $journal->lines()->create([
                'account_id' => $line['account_id'],
                'debit' => number_format(self::cents($line['debit'] ?? 0) / 100, 2, '.', ''),
                'credit' => number_format(self::cents($line['credit'] ?? 0) / 100, 2, '.', ''),
            ]);
        }

        return $journal;
    }

    private function nextNumber(): string
    {
        $last = Journal::lockForUpdate()->orderByDesc('id')->value('number');
        $next = $last ? ((int) substr($last, 3)) + 1 : 1;

        return 'JU-'.str_pad((string) $next, 4, '0', STR_PAD_LEFT);
    }
}
