<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use App\Services\JournalService;
use Database\Seeders\ChartOfAccountsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DashboardTest extends TestCase
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

    private function sama(float $expected): \Closure
    {
        return fn ($actual) => abs($actual - $expected) < 0.01;
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect(route('login'));
    }

    public function test_accountant_sees_kpi_matching_reports(): void
    {
        $this->isiJurnal();
        $user = User::factory()->create(['role' => 'akuntan']);

        $this->actingAs($user)->get('/dashboard?bulan=2026-10')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('month', '2026-10')
                ->where('kpi.cash', $this->sama(109000000))
                ->where('kpi.assets', $this->sama(109000000))
                ->where('kpi.revenue', $this->sama(15000000))
                ->where('kpi.expense', $this->sama(8500000))
                ->where('kpi.net_income', $this->sama(6500000))
                ->where('balanced', true)
                ->has('chart', 6)
                ->has('recent', 4));
    }

    public function test_default_month_is_month_of_latest_journal(): void
    {
        $this->isiJurnal();
        $user = User::factory()->create(['role' => 'manager']);

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('month', '2026-10')
                ->where('as_of', '2026-10-31'));
    }

    public function test_manager_can_open_dashboard(): void
    {
        $this->isiJurnal();
        $user = User::factory()->create(['role' => 'manager']);

        $this->actingAs($user)->get('/dashboard')->assertOk();
    }

    public function test_dashboard_works_without_any_journal(): void
    {
        $user = User::factory()->create(['role' => 'akuntan']);

        $this->actingAs($user)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('dashboard')
                ->where('kpi.revenue', $this->sama(0))
                ->has('recent', 0)
                ->where('balanced', true));
    }

    public function test_invalid_month_is_rejected(): void
    {
        $user = User::factory()->create(['role' => 'akuntan']);

        $this->actingAs($user)->get('/dashboard?bulan=abc')
            ->assertSessionHasErrors('bulan');
    }
}
