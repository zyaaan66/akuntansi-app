<?php

use App\Http\Controllers\AccountController;
use App\Http\Controllers\JournalController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');

    // COA: akuntan dan manager boleh melihat
    Route::get('accounts', [AccountController::class, 'index'])->name('accounts.index');

    // COA: hanya akuntan boleh menambah
    Route::post('accounts', [AccountController::class, 'store'])
        ->middleware('role:akuntan')
        ->name('accounts.store');

    // Jurnal: hanya akuntan boleh input
    Route::middleware('role:akuntan')->group(function () {
        Route::get('journals/create', [JournalController::class, 'create'])->name('journals.create');
        Route::post('journals', [JournalController::class, 'store'])->name('journals.store');
        Route::post('journals/upload', [JournalController::class, 'upload'])->name('journals.upload');
    });
});

require __DIR__.'/settings.php';