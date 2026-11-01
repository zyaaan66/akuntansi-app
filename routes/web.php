<?php

use App\Http\Controllers\AccountController;
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
});

require __DIR__.'/settings.php';