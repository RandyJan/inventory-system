<?php

namespace App\Http\Controllers;

use App\Http\Requests\AuditIndexRequest;
use App\Services\AuditService;
use Inertia\Inertia;
use Inertia\Response;

class AuditController
{
    public function __construct(protected AuditService $service) {}

    public function index(AuditIndexRequest $request): Response
    {
        $perPage = $request->input('per_page', 25);
        $filters = $request->only(['search', 'causer_id', 'type']);

        $activities = $this->service->list($filters, (int) $perPage);

        return Inertia::render('audit/index', [
            'activities' => $activities,
            'filters' => $filters,
        ]);
    }

    public function show(int $id): Response
    {
        $activity = $this->service->find($id);

        if (! $activity) {
            abort(404);
        }

        // Return full activity for the modal or separate page
        return Inertia::render('audit/show', [
            'activity' => $activity,
        ]);
    }
}
