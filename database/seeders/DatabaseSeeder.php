<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->buatUser('Akuntan Demo', 'akuntan@example.com', 'akuntan');
        $this->buatUser('Manager Demo', 'manager@example.com', 'manager');
    }

    private function buatUser(string $nama, string $email, string $role): void
    {
        $user = User::firstOrNew(['email' => $email]);

        $user->forceFill([
            'name' => $nama,
            'role' => $role,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ])->save();
    }
}