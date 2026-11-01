<?php

namespace App\Http\Requests;

use App\Models\Account;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAccountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'akuntan';
    }

    public function rules(): array
    {
        $type = $this->input('type');

        return [
            'code' => ['required', 'string', 'max:20', 'unique:accounts,code'],
            'name' => ['required', 'string', 'max:100'],
            'type' => ['required', Rule::in(array_keys(Account::CATEGORIES))],
            'category' => [
                'required',
                Rule::in(Account::CATEGORIES[$type] ?? []),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'code.unique' => 'Kode akun sudah dipakai.',
            'code.required' => 'Kode akun wajib diisi.',
            'name.required' => 'Nama akun wajib diisi.',
            'type.in' => 'Jenis akun tidak valid.',
            'category.in' => 'Kelompok tidak sesuai dengan jenis akun.',
        ];
    }
}