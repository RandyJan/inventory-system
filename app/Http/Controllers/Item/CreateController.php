<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Services\InventoryCategoryService;
use Inertia\Inertia;
use Inertia\Response;

class CreateController extends Controller
{
    public function __invoke(InventoryCategoryService $categories): Response
    {
        return Inertia::render('items/create', [
            'categories' => $categories->options(),
        ]);
    }
}
