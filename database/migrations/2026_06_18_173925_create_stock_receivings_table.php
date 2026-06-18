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
        Schema::create('stock_receivings', function (Blueprint $table): void {
            $table->id();
            $table->string('receiving_number')->unique();
            $table->foreignId('supplier_id')->constrained()->restrictOnDelete();
            $table->date('delivery_date')->index();
            $table->string('purchase_order_reference')->nullable()->index();
            $table->foreignId('received_by')->constrained('users')->restrictOnDelete();
            $table->decimal('total_quantity_received', 12, 2)->default(0);
            $table->text('remarks')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_receivings');
    }
};
