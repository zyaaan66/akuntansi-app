<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Services\JournalService;
use App\Services\ReportService;
use Database\Seeders\ChartOfAccountsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    private function isiJurnal(): void
    {
        $this->seed(ChartOfAccountsSeeder::class);
        $user = User::factory()->create(['role' => 'akuntan']);
        $id = fn (string $code) => Account::where('code', $code)->value('id');
        $service = app(JournalService::class);

        $buat = function (string $tanggal, string $debit, string $kredit, int $jumlah) use ($service, $id, $user) {
            $service->create([
                'date' => $tanggal,
                'description' => 'Contoh',
                'lines' => [
                    ['account_id' => $id($debit), 'debit' => $jumlah, 'credit' => 0],
                    ['account_id' => $id($kredit), 'debit' => 0, 'credit' => $jumlah],
                ],
            ], 'manual', $user->id);
        };

        $buat('2026-10-01', '1-100', '3-100', 100000000); // modal
        $buat('2026-10-10', '1-100', '4-200', 15000000);  // penjualan
        $buat('2026-10-20', '5-100', '1-100', 6000000);   // gaji
        $buat('2026-10-25', '5-110', '2-100', 2500000);   // sewa belum dibayar
    }

    public function test_trial_balance_is_balanced(): void
    {
        $this->isiJurnal();

        $r = app(ReportService::class)->trialBalance('2026-12-31');

        $this->assertTrue($r['balanced']);
        $this->assertEquals($r['total_debit'], $r['total_credit']);
        $this->assertEquals(117500000, $r['total_debit']);
    }

    public function test_income_statement_calculates_net_income_for_period(): void
    {
        $this->isiJurnal();

        $r = app(ReportService::class)->incomeStatement('2026-10-01', '2026-10-31');

        $this->assertEquals(15000000, $r['total_revenue']);
        $this->assertEquals(8500000, $r['total_expense']);
        $this->assertEquals(6500000, $r['net_income']);
    }

    public function test_income_statement_respects_period(): void
    {
        $this->isiJurnal();

        $r = app(ReportService::class)->incomeStatement('2026-10-15', '2026-10-31');

        $this->assertEquals(0, $r['total_revenue']);
        $this->assertEquals(8500000, $r['total_expense']);
    }

    public function test_balance_sheet_equation_holds(): void
    {
        $this->isiJurnal();

        $r = app(ReportService::class)->balanceSheet('2026-12-31');

        $this->assertTrue($r['balanced']);
        $this->assertEquals(109000000, $r['total_assets']); // 100jt + 15jt - 6jt
        $this->assertEquals(2500000, $r['total_liabilities']);
        $this->assertEquals(106500000, $r['total_equity']); // modal 100jt + laba 6,5jt
    }

    public function test_ledger_shows_opening_balance_and_running_balance(): void
    {
        $this->isiJurnal();
        $kas = Account::where('code', '1-100')->value('id');

        $r = app(ReportService::class)->generalLedger('2026-10-15', '2026-10-31', $kas);

        $this->assertCount(1, $r);
        $this->assertEquals(115000000, $r[0]['opening']); // 100jt + 15jt sebelum 15 Okt
        $this->assertEquals(109000000, $r[0]['closing']); // dikurangi gaji 6jt
    }

    public function test_manager_and_akuntan_can_open_all_reports(): void
    {
        $this->isiJurnal();

        $urls = [
            '/laporan/transaksi',
            '/laporan/buku-besar',
            '/laporan/neraca-saldo',
            '/laporan/laba-rugi',
            '/laporan/neraca',
            '/laporan/posisi-keuangan',
        ];

        foreach (['manager', 'akuntan'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            foreach ($urls as $url) {
                $this->actingAs($user)->get($url)->assertOk();
            }
        }
    }

    public function test_guest_cannot_open_reports(): void
    {
        $this->get('/laporan/neraca')->assertRedirect(route('login'));
    }
}
