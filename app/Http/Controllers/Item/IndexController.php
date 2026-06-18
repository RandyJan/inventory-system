<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\InventoryCategoryService;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    public function __invoke(InventoryCategoryService $categoryService): Response
    {
        $search = request()->input('search', '');
        $category = request()->input('category', '');
        $showArchived = request()->input('show_archived', false);
        $perPage = request()->input('per_page', 25);

        $query = Item::query();

        if ($search) {
            $query->search($search);
        }

        if ($category) {
            $query->where('category', $category);
        }

        if (! $showArchived) {
            $query->active();
        }

        $items = $query->paginate((int) $perPage);

        $categories = $categoryService->rootCategories()
            ->pluck('name')
            ->sort()
            ->values()
            ->toArray();

        return Inertia::render('items/index', [
            'items' => $items,
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'category' => $category,
                'show_archived' => $showArchived,
                'per_page' => $perPage,
            ],
        ]);
    }
}
