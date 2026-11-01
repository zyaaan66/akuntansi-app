<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAccountRequest;
use App\Models\Account;
use Inertia\Inertia;
use Inertia\Response;

class AccountController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('accounts/index', [
            'accounts' => Account::orderBy('code')->get(),
            'categories' => Account::CATEGORIES,
            'canCreate' => request()->user()->role === 'akuntan',
        ]);
    }

    public function store(StoreAccountRequest $request)
    {
        $data = $request->validated();
        $data['normal_balance'] = Account::NORMAL_BALANCE[$data['type']];

        Account::create($data);

        return back()->with('success', 'Akun berhasil ditambahkan.');
    }
}