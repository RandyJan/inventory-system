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
        Schema::create('stock_count_lines', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stock_count_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained();
            $table->decimal('system_quantity', 12, 2);
            $table->decimal('actual_quantity', 12, 2);
            $table->decimal('variance_quantity', 12, 2);
            $table->string('unit_of_measure', 40);
            $table->string('recommendation', 80);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['stock_count_id', 'item_id'], 'stock_count_item_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_count_lines');
    }
};
