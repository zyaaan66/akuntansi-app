<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AccountTest extends TestCase
{
    use RefreshDatabase;

    private function akuntan(): User
    {
        return User::factory()->create(['role' => 'akuntan']);
    }

    private function manager(): User
    {
        return User::factory()->create(['role' => 'manager']);
    }

    private function data(array $override = []): array
    {
        return array_merge([
            'code' => '1-100',
            'name' => 'Kas',
            'type' => 'aset',
            'category' => 'aset lancar',
        ], $override);
    }

    public function test_akuntan_can_add_account_and_normal_balance_is_automatic(): void
    {
        $this->actingAs($this->akuntan())
            ->post('/accounts', $this->data())
            ->assertSessionHasNoErrors();

        $this->assertDatabaseHas('accounts', [
            'code' => '1-100',
            'normal_balance' => 'debit',
        ]);
    }

    public function test_liability_account_gets_credit_normal_balance(): void
    {
        $this->actingAs($this->akuntan())->post('/accounts', $this->data([
            'code' => '2-100',
            'name' => 'Utang Usaha',
            'type' => 'kewajiban',
            'category' => 'kewajiban jangka pendek',
        ]));

        $this->assertDatabaseHas('accounts', ['code' => '2-100', 'normal_balance' => 'kredit']);
    }

    public function test_duplicate_account_code_is_rejected(): void
    {
        $this->actingAs($this->akuntan());
        $this->post('/accounts', $this->data());

        $this->post('/accounts', $this->data(['name' => 'Kas Lain']))
            ->assertSessionHasErrors('code');

        $this->assertSame(1, Account::count());
    }

    public function test_category_must_match_type(): void
    {
        $this->actingAs($this->akuntan())
            ->post('/accounts', $this->data(['category' => 'beban']))
            ->assertSessionHasErrors('category');
    }

    public function test_manager_cannot_add_account(): void
    {
        $this->actingAs($this->manager())
            ->post('/accounts', $this->data())
            ->assertForbidden();

        $this->assertSame(0, Account::count());
    }

    public function test_manager_can_view_account_list(): void
    {
        $this->actingAs($this->manager())->get('/accounts')->assertOk();
    }
}
