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
        Schema::create('warehouses', function (Blueprint $table): void {
            $table->id();
            $table->string('warehouse_code', 50)->unique();
            $table->string('name');
            $table->string('type')->default('warehouse');
            $table->foreignId('manager_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('campus')->nullable();
            $table->string('building')->nullable();
            $table->text('address')->nullable();
            $table->decimal('capacity', 12, 2)->default(0);
            $table->decimal('used_capacity', 12, 2)->default(0);
            $table->boolean('is_active')->default(true)->index();
            $table->text('notes')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['name', 'is_active']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('warehouses');
    }
};
