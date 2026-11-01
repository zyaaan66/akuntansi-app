<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Journal;
use App\Services\ReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ReportController extends Controller
{
    public function __construct(private ReportService $reports) {}

    /** Ambil rentang tanggal dari URL. Kalau kosong: dari awal data/tahun sampai data terakhir/hari ini. */
    private function range(Request $request): array
    {
        $request->validate([
            'dari' => ['nullable', 'date_format:Y-m-d'],
            'sampai' => ['nullable', 'date_format:Y-m-d'],
            'account_id' => ['nullable', 'integer'],
        ]);

        $today = now()->toDateString();
        $yearStart = now()->startOfYear()->toDateString();

        $from = $request->input('dari') ?: min($yearStart, Journal::min('date') ?? $yearStart);
        $to = $request->input('sampai') ?: max($today, Journal::max('date') ?? $today);

        return [$from, $to];
    }

    public function transactions(Request $request): Response
    {
        [$from, $to] = $this->range($request);

        return Inertia::render('reports/transactions', [
            'filters' => ['dari' => $from, 'sampai' => $to],
            'journals' => Journal::with(['lines.account:id,code,name', 'creator:id,name'])
                ->whereBetween('date', [$from, $to])
                ->orderByDesc('date')
                ->orderByDesc('id')
                ->paginate(10)
                ->withQueryString(),
        ]);
    }

    public function ledger(Request $request): Response
    {
        [$from, $to] = $this->range($request);
        $accountId = $request->input('account_id') ? (int) $request->input('account_id') : null;

        return Inertia::render('reports/ledger', [
            'filters' => ['dari' => $from, 'sampai' => $to, 'account_id' => $accountId ? (string) $accountId : ''],
            'accountOptions' => Account::orderBy('code')->get(['id', 'code', 'name']),
            'ledger' => $this->reports->generalLedger($from, $to, $accountId),
        ]);
    }

    public function trialBalance(Request $request): Response
    {
        [, $to] = $this->range($request);

        return Inertia::render('reports/trial-balance', [
            'filters' => ['sampai' => $to],
            'report' => $this->reports->trialBalance($to),
        ]);
    }

    public function incomeStatement(Request $request): Response
    {
        [$from, $to] = $this->range($request);

        return Inertia::render('reports/income-statement', [
            'filters' => ['dari' => $from, 'sampai' => $to],
            'report' => $this->reports->incomeStatement($from, $to),
        ]);
    }

    public function balanceSheet(Request $request): Response
    {
        return $this->sheet($request, false);
    }

    public function financialPosition(Request $request): Response
    {
        return $this->sheet($request, true);
    }

    private function sheet(Request $request, bool $detailed): Response
    {
        [, $to] = $this->range($request);

        return Inertia::render('reports/balance-sheet', [
            'filters' => ['sampai' => $to],
            'detailed' => $detailed,
            'report' => $this->reports->balanceSheet($to),
        ]);
    }
}
