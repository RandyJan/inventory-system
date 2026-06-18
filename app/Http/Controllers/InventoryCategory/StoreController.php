<?php

namespace App\Http\Controllers\InventoryCategory;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryCategory\StoreInventoryCategoryRequest;
use App\Services\InventoryCategoryService;
use Illuminate\Http\RedirectResponse;

class StoreController extends Controller
{
    public function __invoke(
        StoreInventoryCategoryRequest $request,
        InventoryCategoryService $categories
    ): RedirectResponse {
        $categories->create($request->validated());

        return redirect()->route('inventory-categories.index')
            ->with('success', 'Category saved successfully.');
    }
}
