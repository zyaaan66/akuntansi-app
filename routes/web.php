<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\JournalController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;

// Tidak ada halaman depan: langsung ke dashboard (tamu otomatis diarahkan ke login)
Route::redirect('/', '/dashboard')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // COA: akuntan dan manager boleh melihat
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts.index');

    // COA: hanya akuntan boleh menambah
    Route::post('accounts', [AccountController::class, 'store'])
        ->middleware('role:akuntan')
        ->name('accounts.store');

    // Laporan: akuntan dan manager boleh melihat
    Route::prefix('laporan')->name('reports.')->group(function () {
        Route::get('transaksi', [ReportController::class, 'transactions'])->name('transactions');
        Route::get('buku-besar', [ReportController::class, 'ledger'])->name('ledger');
        Route::get('neraca-saldo', [ReportController::class, 'trialBalance'])->name('trial-balance');
        Route::get('laba-rugi', [ReportController::class, 'incomeStatement'])->name('income-statement');
        Route::get('neraca', [ReportController::class, 'balanceSheet'])->name('balance-sheet');
        Route::get('posisi-keuangan', [ReportController::class, 'financialPosition'])->name('financial-position');
    });

    // Jurnal: hanya akuntan boleh input
    Route::middleware('role:akuntan')->group(function () {
        Route::get('journals/create', [JournalController::class, 'create'])->name('journals.create');
        Route::post('journals', [JournalController::class, 'store'])->name('journals.store');
        Route::post('journals/upload', [JournalController::class, 'upload'])->name('journals.upload');
    });
});

require __DIR__.'/settings.php';