<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Inertia\Inertia;
use Inertia\Response;

class ShowController extends Controller
{
    public function __invoke(Item $item): Response
    {
        return Inertia::render('items/show', [
            'item' => $item,
        ]);
    }
}
