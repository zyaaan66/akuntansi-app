<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('journals', function (Blueprint $table) {
            $table->foreignId('reversal_of')
                ->nullable()
                ->after('source')
                ->constrained('journals');
        });

        DB::statement('
            ALTER TABLE journal_lines
            ADD CONSTRAINT journal_lines_debit_credit_check
            CHECK (
                debit >= 0
                AND credit >= 0
                AND (debit = 0 OR credit = 0)
                AND (debit > 0 OR credit > 0)
            )
        ');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE journal_lines DROP CHECK journal_lines_debit_credit_check');

        Schema::table('journals', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reversal_of');
        });
    }
};