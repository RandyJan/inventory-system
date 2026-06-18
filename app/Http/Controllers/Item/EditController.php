<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Models\Item;
use App\Services\InventoryCategoryService;
use Inertia\Inertia;
use Inertia\Response;

class EditController extends Controller
{
    public function __invoke(Item $item, InventoryCategoryService $categories): Response
    {
        return Inertia::render('items/edit', [
            'item' => $item,
            'categories' => $categories->options(),
        ]);
    }
}
