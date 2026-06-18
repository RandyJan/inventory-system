<?php

namespace App\Http\Controllers\InventoryCategory;

use App\Http\Controllers\Controller;
use App\Http\Requests\InventoryCategory\UpdateInventoryCategoryRequest;
use App\Models\InventoryCategory;
use App\Services\InventoryCategoryService;
use Illuminate\Http\RedirectResponse;

class UpdateController extends Controller
{
    public function __invoke(
        InventoryCategory $inventoryCategory,
        UpdateInventoryCategoryRequest $request,
        InventoryCategoryService $categories
    ): RedirectResponse {
        $categories->update($inventoryCategory, $request->validated());

        return redirect()->route('inventory-categories.index')
            ->with('success', 'Category updated successfully.');
    }
}
