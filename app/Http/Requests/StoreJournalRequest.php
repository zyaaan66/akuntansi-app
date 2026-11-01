<?php

namespace App\Http\Requests;

use App\Services\JournalService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreJournalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'akuntan';
    }

    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'description' => ['required', 'string', 'max:255'],
            'lines' => ['required', 'array', 'min:2'],
            'lines.*.account_id' => [
                'required',
                'integer',
                Rule::exists('accounts', 'id')->where('is_active', true),
            ],
            'lines.*.debit' => ['nullable', 'numeric', 'min:0', 'max:9999999999999999'],
            'lines.*.credit' => ['nullable', 'numeric', 'min:0', 'max:9999999999999999'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.required' => 'Tanggal wajib diisi.',
            'date.date_format' => 'Format tanggal tidak valid.',
            'description.required' => 'Keterangan wajib diisi.',
            'lines.required' => 'Jurnal minimal punya 2 baris.',
            'lines.min' => 'Jurnal minimal punya 2 baris.',
            'lines.*.account_id.required' => 'Pilih akun.',
            'lines.*.account_id.exists' => 'Akun tidak ada atau tidak aktif.',
            'lines.*.debit.numeric' => 'Debit harus angka.',
            'lines.*.credit.numeric' => 'Kredit harus angka.',
            'lines.*.debit.min' => 'Debit tidak boleh negatif.',
            'lines.*.credit.min' => 'Kredit tidak boleh negatif.',
        ];
    }

    public function after(): array
    {
        return [
            function (Validator $validator) {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $message = JournalService::checkLines($this->input('lines', []));
                if ($message !== null) {
                    $validator->errors()->add('lines', $message);
                }
            },
        ];
    }
}
