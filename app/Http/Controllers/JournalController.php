<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreJournalRequest;
use App\Models\Account;
use App\Services\JournalImporter;
use App\Services\JournalService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class JournalController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('journals/create', [
            'accounts' => Account::where('is_active', true)
                ->orderBy('code')
                ->get(['id', 'code', 'name']),
        ]);
    }

    public function store(StoreJournalRequest $request, JournalService $service)
    {
        $journal = $service->create($request->validated(), 'manual', $request->user()->id);

        return back()->with('notice', "Jurnal {$journal->number} berhasil disimpan.");
    }

    public function upload(Request $request, JournalImporter $importer, JournalService $service)
    {
        $request->validate(
            ['file' => ['required', 'file', 'mimes:csv,txt', 'max:2048']],
            [
                'file.required' => 'Pilih file CSV dulu.',
                'file.mimes' => 'File harus berformat CSV.',
                'file.max' => 'Ukuran file maksimal 2 MB.',
            ]
        );

        $journals = $importer->parse($request->file('file')->getRealPath());
        $count = $service->createMany($journals, 'upload', $request->user()->id);

        return back()->with('notice', "{$count} jurnal berhasil diimpor dari file.");
    }
}
