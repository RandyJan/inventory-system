<?php

namespace App\Http\Controllers\InventoryCategory;

use App\Http\Controllers\Controller;
use App\Services\InventoryCategoryService;
use Inertia\Inertia;
use Inertia\Response;

class IndexController extends Controller
{
    public function __invoke(InventoryCategoryService $categories): Response
    {
        return Inertia::render('inventory-categories/index', [
            'categories' => $categories->report(),
            'categoryOptions' => $categories->rootCategories(),
        ]);
    }
}
