<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('items', function (Blueprint $table): void {
            $table->foreignId('category_id')
                ->nullable()
                ->after('subcategory')
                ->constrained('inventory_categories')
                ->nullOnDelete();
            $table->foreignId('subcategory_id')
                ->nullable()
                ->after('category_id')
                ->constrained('inventory_categories')
                ->nullOnDelete();

            $table->index(['category_id', 'subcategory_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('subcategory_id');
            $table->dropConstrainedForeignId('category_id');
        });
    }
};
