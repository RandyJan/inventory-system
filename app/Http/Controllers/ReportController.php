<?php

namespace App\Http\Controllers;

use App\Services\ReportCatalogService;
use App\Services\ReportDataService;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(
        private readonly ReportCatalogService $reports,
        private readonly ReportDataService $reportData
    ) {}

    public function __invoke(): Response
    {
        return Inertia::render('reports/index', [
            'catalog' => $this->reports->catalog(),
        ]);
    }

    public function show(string $report): Response
    {
        return Inertia::render('reports/show', [
            'detail' => $this->reportData->detail($report),
        ]);
    }

    public function export(string $report): StreamedResponse
    {
        $detail = $this->reportData->detail($report);

        return response()->streamDownload(function () use ($detail): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                return;
            }

            fputcsv($output, collect($detail['columns'])->pluck('label')->all());

            foreach ($detail['rows'] as $row) {
                fputcsv($output, collect($detail['columns'])
                    ->map(fn (array $column): mixed => $row[$column['key']] ?? '')
                    ->all());
            }

            fclose($output);
        }, $detail['export_filename'], [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
