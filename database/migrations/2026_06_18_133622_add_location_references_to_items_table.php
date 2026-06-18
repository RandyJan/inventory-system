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
            $table->foreignId('warehouse_id')->nullable()->after('subcategory_id')->constrained()->nullOnDelete();
            $table->foreignId('warehouse_location_id')->nullable()->after('warehouse_id')->constrained('warehouse_locations')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('warehouse_location_id');
            $table->dropConstrainedForeignId('warehouse_id');
        });
    }
};
