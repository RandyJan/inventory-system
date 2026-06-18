<?php

namespace App\Http\Controllers\Item;

use App\Http\Controllers\Controller;
use App\Models\Item;
use Illuminate\Http\RedirectResponse;

class DestroyController extends Controller
{
    public function __invoke(Item $item): RedirectResponse
    {
        $item->is_archived = true;
        $item->save();

        return redirect()->route('items.index')
            ->with('success', 'Item archived successfully.');
    }
}
