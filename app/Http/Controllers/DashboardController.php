<?php

namespace App\Http\Controllers;

use App\Services\DashboardAnalyticsService;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly DashboardAnalyticsService $analytics) {}

    public function __invoke(): Response
    {
        return Inertia::render('dashboard', [
            'analytics' => $this->analytics->analytics(),
        ]);
    }
}
