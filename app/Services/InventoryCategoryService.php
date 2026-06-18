<?php

namespace App\Services;

use App\Models\InventoryCategory;
use App\Models\Item;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class InventoryCategoryService
{
    /**
     * @return Collection<int, array<string, mixed>>
     */
    public function report(): Collection
    {
        return InventoryCategory::query()
            ->root()
            ->with([
                'subcategories' => fn ($query) => $query
                    ->withCount('subcategoryItems')
                    ->orderBy('name'),
            ])
            ->withCount('items')
            ->select('inventory_categories.*')
            ->selectSub(
                Item::query()
                    ->selectRaw('coalesce(sum(standard_cost), 0)')
                    ->whereColumn('items.category_id', 'inventory_categories.id')
                    ->where('items.is_archived', false),
                'active_inventory_value'
            )
            ->orderBy('name')
            ->get()
            ->map(fn (InventoryCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'description' => $category->description,
                'is_active' => $category->is_active,
                'items_count' => (int) $category->items_count,
                'active_inventory_value' => (float) $category->active_inventory_value,
                'subcategories' => $category->subcategories->map(fn (InventoryCategory $subcategory): array => [
                    'id' => $subcategory->id,
                    'name' => $subcategory->name,
                    'description' => $subcategory->description,
                    'is_active' => $subcategory->is_active,
                    'items_count' => (int) $subcategory->subcategory_items_count,
                    'parent_id' => $subcategory->parent_id,
                ])->values(),
            ]);
    }

    /**
     * @return Collection<int, array{id: int, name: string, subcategories: Collection<int, array{id: int, name: string}>}>
     */
    public function options(): Collection
    {
        return InventoryCategory::query()
            ->root()
            ->active()
            ->with(['subcategories' => fn ($query) => $query->active()->orderBy('name')])
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (InventoryCategory $category): array => [
                'id' => $category->id,
                'name' => $category->name,
                'subcategories' => $category->subcategories->map(fn (InventoryCategory $subcategory): array => [
                    'id' => $subcategory->id,
                    'name' => $subcategory->name,
                ])->values(),
            ]);
    }

    /**
     * @param  array{name: string, description?: string|null, parent_id?: int|null, is_active?: bool}  $data
     */
    public function create(array $data): InventoryCategory
    {
        $this->ensureParentIsRoot($data['parent_id'] ?? null);
        $this->ensureUniqueName($data['name'], $data['parent_id'] ?? null);

        return InventoryCategory::create([
            'parent_id' => $data['parent_id'] ?? null,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);
    }

    /**
     * @param  array{name: string, description?: string|null, parent_id?: int|null, is_active?: bool}  $data
     */
    public function update(InventoryCategory $category, array $data): InventoryCategory
    {
        $parentId = $data['parent_id'] ?? null;

        if ($parentId === $category->id) {
            throw ValidationException::withMessages([
                'parent_id' => 'A category cannot be its own parent.',
            ]);
        }

        $this->ensureParentIsRoot($parentId);
        $this->ensureUniqueName($data['name'], $parentId, $category);

        $category->update([
            'parent_id' => $parentId,
            'name' => $data['name'],
            'description' => $data['description'] ?? null,
            'is_active' => $data['is_active'] ?? true,
        ]);

        return $category;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function itemData(array $data): array
    {
        $category = isset($data['category_id'])
            ? InventoryCategory::query()->find((int) $data['category_id'])
            : null;
        $subcategory = isset($data['subcategory_id'])
            ? InventoryCategory::query()->find((int) $data['subcategory_id'])
            : null;

        if ($subcategory !== null && $category !== null && (int) $subcategory->parent_id !== (int) $category->id) {
            throw ValidationException::withMessages([
                'subcategory_id' => 'The selected subcategory does not belong to the selected category.',
            ]);
        }

        if ($category !== null) {
            $data['category'] = $category->name;
        }

        if ($subcategory !== null) {
            $data['subcategory'] = $subcategory->name;
        } elseif ($category !== null) {
            $data['subcategory'] = null;
            $data['subcategory_id'] = null;
        }

        if ($category === null && blank($data['category'] ?? null)) {
            throw ValidationException::withMessages([
                'category' => 'The category is required.',
            ]);
        }

        return $data;
    }

    /**
     * @return EloquentCollection<int, InventoryCategory>
     */
    public function rootCategories(): EloquentCollection
    {
        return InventoryCategory::query()
            ->root()
            ->active()
            ->orderBy('name')
            ->get(['id', 'name']);
    }

    private function ensureParentIsRoot(?int $parentId): void
    {
        if ($parentId === null) {
            return;
        }

        $isNestedSubcategory = InventoryCategory::query()
            ->whereKey($parentId)
            ->whereNotNull('parent_id')
            ->exists();

        if ($isNestedSubcategory) {
            throw ValidationException::withMessages([
                'parent_id' => 'Subcategories can only be assigned to a top-level category.',
            ]);
        }
    }

    private function ensureUniqueName(string $name, ?int $parentId, ?InventoryCategory $except = null): void
    {
        $duplicateExists = InventoryCategory::query()
            ->when(
                $parentId === null,
                fn ($query) => $query->whereNull('parent_id'),
                fn ($query) => $query->where('parent_id', $parentId),
            )
            ->where('name', $name)
            ->when($except !== null, fn ($query) => $query->whereKeyNot($except->getKey()))
            ->exists();

        if ($duplicateExists) {
            throw ValidationException::withMessages([
                'name' => 'A category with this name already exists at this level.',
            ]);
        }
    }
}
