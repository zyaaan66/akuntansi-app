<?php

namespace App\Services;

use App\Models\Account;
use DateTime;
use Illuminate\Validation\ValidationException;

class JournalImporter
{
    private const COLUMNS = ['no_jurnal', 'tanggal', 'keterangan', 'kode_akun', 'debit', 'kredit'];

    private const MAX_ERRORS = 30;

    /**
     * Baca file CSV, kelompokkan per no_jurnal, validasi semuanya.
     * Kalau ada SATU saja yang salah, lempar error dan tidak ada yang disimpan.
     *
     * @return array<int, array{date: string, description: string, lines: array}>
     */
    public function parse(string $path): array
    {
        $fh = fopen($path, 'r');
        $first = fgets($fh);

        if ($first === false) {
            $this->fail(['File kosong.']);
        }

        $first = preg_replace('/^\xEF\xBB\xBF/', '', $first);
        $delim = substr_count($first, ';') > substr_count($first, ',') ? ';' : ',';
        $header = array_map(
            fn ($h) => strtolower(trim($h)),
            str_getcsv(rtrim($first, "\r\n"), $delim, '"', '')
        );

        if (array_diff(self::COLUMNS, $header)) {
            $this->fail(['Header kolom salah. Harus ada: '.implode(', ', self::COLUMNS).'.']);
        }

        $idx = array_flip($header);
        $accounts = Account::where('is_active', true)->pluck('id', 'code');

        $errors = [];
        $groups = [];
        $n = 1;

        while (($line = fgets($fh)) !== false) {
            $n++;
            if (trim($line) === '') {
                continue;
            }

            $r = str_getcsv(rtrim($line, "\r\n"), $delim, '"', '');
            $get = fn (string $k) => trim($r[$idx[$k]] ?? '');

            $key = $get('no_jurnal');
            $date = $get('tanggal');
            $desc = $get('keterangan');
            $code = $get('kode_akun');
            $rowErrors = [];

            if ($key === '') {
                $rowErrors[] = 'no_jurnal kosong.';
            }

            $d = DateTime::createFromFormat('!Y-m-d', $date);
            if (! $d || $d->format('Y-m-d') !== $date) {
                $rowErrors[] = "tanggal '{$date}' tidak valid (format harus YYYY-MM-DD).";
            }

            if ($desc === '' || mb_strlen($desc) > 255) {
                $rowErrors[] = 'keterangan wajib diisi (maksimal 255 karakter).';
            }

            if (! isset($accounts[$code])) {
                $rowErrors[] = "kode_akun '{$code}' tidak ada atau tidak aktif.";
            }

            $amounts = [];
            foreach (['debit', 'kredit'] as $col) {
                $v = $get($col);
                if ($v === '') {
                    $amounts[$col] = 0;
                } elseif (! is_numeric($v) || (float) $v < 0) {
                    $rowErrors[] = "{$col} '{$v}' bukan angka (tulis angka polos tanpa titik ribuan, contoh 1500000.50).";
                    $amounts[$col] = 0;
                } else {
                    $amounts[$col] = $v;
                }
            }

            if ($key !== '' && isset($groups[$key])
                && ($groups[$key]['date'] !== $date || $groups[$key]['description'] !== $desc)) {
                $rowErrors[] = "tanggal/keterangan berbeda dari baris pertama jurnal '{$key}'.";
            }

            if ($rowErrors) {
                foreach ($rowErrors as $e) {
                    $errors[] = "Baris {$n}: {$e}";
                }
                if ($key !== '') {
                    $groups[$key] ??= ['date' => $date, 'description' => $desc, 'row' => $n, 'lines' => []];
                    $groups[$key]['bad'] = true;
                }

                continue;
            }

            $groups[$key] ??= ['date' => $date, 'description' => $desc, 'row' => $n, 'lines' => []];
            $groups[$key]['lines'][] = [
                'account_id' => $accounts[$code],
                'debit' => $amounts['debit'],
                'credit' => $amounts['kredit'],
            ];
        }

        fclose($fh);

        if (! $groups && ! $errors) {
            $this->fail(['File tidak berisi data jurnal.']);
        }

        $result = [];
        foreach ($groups as $key => $g) {
            if ($g['bad'] ?? false) {
                continue;
            }
            $msg = JournalService::checkLines($g['lines']);
            if ($msg !== null) {
                $errors[] = "Jurnal '{$key}' (mulai baris {$g['row']}): {$msg}";
            } else {
                $result[] = ['date' => $g['date'], 'description' => $g['description'], 'lines' => $g['lines']];
            }
        }

        if ($errors) {
            $this->fail($errors);
        }

        return $result;
    }

    private function fail(array $errors): never
    {
        $shown = array_slice($errors, 0, self::MAX_ERRORS);
        if (count($errors) > self::MAX_ERRORS) {
            $shown[] = '... dan '.(count($errors) - self::MAX_ERRORS).' kesalahan lain.';
        }
        $shown[] = 'Tidak ada jurnal yang disimpan.';

        throw ValidationException::withMessages(['file' => implode("\n", $shown)]);
    }
}
