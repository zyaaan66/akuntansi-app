<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Journal;
use App\Models\User;
use App\Services\JournalService;
use Database\Seeders\ChartOfAccountsSeeder;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class JournalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(ChartOfAccountsSeeder::class);
    }

    private function akuntan(): User
    {
        return User::factory()->create(['role' => 'akuntan']);
    }

    private function id(string $code): int
    {
        return Account::where('code', $code)->value('id');
    }

    private function payload(int|float $debit = 1000000, int|float $credit = 1000000): array
    {
        return [
            'date' => '2026-11-01',
            'description' => 'Penjualan tunai',
            'lines' => [
                ['account_id' => $this->id('1-100'), 'debit' => $debit, 'credit' => ''],
                ['account_id' => $this->id('4-200'), 'debit' => '', 'credit' => $credit],
            ],
        ];
    }

    private function csv(string $body): UploadedFile
    {
        return UploadedFile::fake()->createWithContent(
            'jurnal.csv',
            "no_jurnal,tanggal,keterangan,kode_akun,debit,kredit\n".$body
        );
    }

    public function test_balanced_journal_is_saved_with_automatic_number(): void
    {
        $this->actingAs($this->akuntan())
            ->post('/journals', $this->payload())
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('journals', ['number' => 'JU-0001', 'source' => 'manual']);
        $this->assertSame(2, Journal::first()->lines()->count());
    }

    public function test_journal_numbers_increase(): void
    {
        $this->actingAs($this->akuntan());
        $this->post('/journals', $this->payload());
        $this->post('/journals', $this->payload());

        $this->assertDatabaseHas('journals', ['number' => 'JU-0002']);
    }

    public function test_unbalanced_journal_is_rejected_and_nothing_is_saved(): void
    {
        $this->actingAs($this->akuntan())
            ->post('/journals', $this->payload(1000000, 900000))
            ->assertSessionHasErrors('lines');

        $this->assertSame(0, Journal::count());
    }

    public function test_line_with_both_debit_and_credit_is_rejected(): void
    {
        $data = $this->payload();
        $data['lines'][0]['credit'] = 500;

        $this->actingAs($this->akuntan())
            ->post('/journals', $data)
            ->assertSessionHasErrors('lines');

        $this->assertSame(0, Journal::count());
    }

    public function test_inactive_account_cannot_be_used(): void
    {
        Account::where('code', '1-100')->update(['is_active' => false]);

        $this->actingAs($this->akuntan())
            ->post('/journals', $this->payload())
            ->assertSessionHasErrors('lines.0.account_id');
    }

    public function test_manager_cannot_input_journal(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);

        $this->actingAs($manager)->post('/journals', $this->payload())->assertForbidden();
        $this->actingAs($manager)->get('/journals/create')->assertForbidden();
        $this->assertSame(0, Journal::count());
    }

    public function test_guest_is_redirected_to_login(): void
    {
        $this->post('/journals', $this->payload())->assertRedirect(route('login'));
    }

    public function test_valid_csv_creates_journals_grouped_by_number(): void
    {
        $file = $this->csv(
            "1,2026-11-01,Modal awal,1-100,50000000,\n".
            "1,2026-11-01,Modal awal,3-100,,50000000\n".
            "2,2026-11-02,Bayar sewa,5-110,1500000,\n".
            "2,2026-11-02,Bayar sewa,1-100,,1500000\n"
        );

        $this->actingAs($this->akuntan())
            ->post('/journals/upload', ['file' => $file])
            ->assertSessionHasNoErrors();

        $this->assertSame(2, Journal::count());
        $this->assertSame(4, DB::table('journal_lines')->count());
        $this->assertDatabaseHas('journals', ['source' => 'upload']);
    }

    public function test_csv_with_one_bad_row_saves_nothing(): void
    {
        $file = $this->csv(
            "1,2026-11-01,Benar,1-100,1000,\n".
            "1,2026-11-01,Benar,3-100,,1000\n".
            "2,2026-11-02,Salah akun,9-999,500,\n".
            "2,2026-11-02,Salah akun,1-100,,500\n"
        );

        $this->actingAs($this->akuntan())
            ->post('/journals/upload', ['file' => $file])
            ->assertSessionHasErrors('file');

        $this->assertSame(0, Journal::count());
    }

    public function test_csv_with_unbalanced_journal_saves_nothing(): void
    {
        $file = $this->csv(
            "1,2026-11-01,Tidak seimbang,1-100,1000,\n".
            "1,2026-11-01,Tidak seimbang,3-100,,900\n"
        );

        $this->actingAs($this->akuntan())
            ->post('/journals/upload', ['file' => $file])
            ->assertSessionHasErrors('file');

        $this->assertSame(0, Journal::count());
    }

    public function test_manager_cannot_upload_csv(): void
    {
        $manager = User::factory()->create(['role' => 'manager']);

        $this->actingAs($manager)
            ->post('/journals/upload', ['file' => $this->csv("1,2026-11-01,X,1-100,1,\n")])
            ->assertForbidden();
    }

    public function test_database_rejects_line_with_both_debit_and_credit(): void
    {
        $user = $this->akuntan();
        $journal = app(JournalService::class)->create($this->payload(), 'manual', $user->id);

        try {
            DB::table('journal_lines')->insert([
                'journal_id' => $journal->id,
                'account_id' => $this->id('1-100'),
                'debit' => 100,
                'credit' => 100,
            ]);
            $this->fail('Database seharusnya menolak baris dengan debit dan kredit sekaligus.');
        } catch (QueryException $e) {
            $this->assertStringContainsString('journal_lines_debit_credit_check', $e->getMessage());
        }
    }
}
