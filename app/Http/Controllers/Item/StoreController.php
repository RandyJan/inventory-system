<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Http\Requests\Item\StoreItemRequest;
use App\Models\Item;
use App\Services\InventoryCategoryService;
use Illuminate\Http\RedirectResponse;

class StoreController extends Controller
{
    public function __invoke(StoreItemRequest $request, InventoryCategoryService $categories): RedirectResponse
    {
        Item::create($categories->itemData($request->validated()));

        return redirect()->route('items.index')
            ->with('success', 'Item created successfully.');
    }
}
