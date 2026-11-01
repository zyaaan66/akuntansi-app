<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    protected $fillable = [
        'code',
        'name',
        'type',
        'category',
        'normal_balance',
        'is_active',
    ];

    public const NORMAL_BALANCE = [
        'aset' => 'debit',
        'beban' => 'debit',
        'kewajiban' => 'kredit',
        'ekuitas' => 'kredit',
        'pendapatan' => 'kredit',
    ];

    public const CATEGORIES = [
        'aset' => ['aset lancar', 'aset tidak lancar'],
        'kewajiban' => ['kewajiban jangka pendek', 'kewajiban jangka panjang'],
        'ekuitas' => ['ekuitas'],
        'pendapatan' => ['pendapatan'],
        'beban' => ['beban'],
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}