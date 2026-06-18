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
        Schema::create('stock_receiving_lines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('stock_receiving_id')->constrained()->cascadeOnDelete();
            $table->foreignId('item_id')->constrained()->restrictOnDelete();
            $table->decimal('quantity_received', 12, 2);
            $table->string('unit_of_measure', 50);
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->unique(['stock_receiving_id', 'item_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_receiving_lines');
    }
};
