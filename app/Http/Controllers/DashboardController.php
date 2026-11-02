<?php

namespace App\Http\Controllers;

use App\Services\DashboardService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, DashboardService $dashboard): Response
    {
        $request->validate([
            'bulan' => ['nullable', 'date_format:Y-m'],
        ]);

        return Inertia::render('dashboard', $dashboard->summary($request->input('bulan')));
    }
}
