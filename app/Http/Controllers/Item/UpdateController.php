<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Http\Requests\Item\UpdateItemRequest;
use App\Models\Item;
use App\Services\InventoryCategoryService;
use Illuminate\Http\RedirectResponse;

class UpdateController extends Controller
{
    public function __invoke(
        Item $item,
        UpdateItemRequest $request,
        InventoryCategoryService $categories
    ): RedirectResponse {
        $item->update($categories->itemData($request->validated()));

        return redirect()->route('items.index')
            ->with('success', 'Item updated successfully.');
    }
}
