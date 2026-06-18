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
        if (! Schema::hasColumn('warehouse_locations', 'building')) {
            Schema::table('warehouse_locations', function (Blueprint $table): void {
                $table->string('building')->nullable()->after('type');
                $table->string('floor')->nullable()->after('building');
                $table->string('room')->nullable()->after('floor');
                $table->string('rack')->nullable()->after('room');
                $table->string('shelf')->nullable()->after('rack');
                $table->string('bin')->nullable()->after('shelf');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('warehouse_locations', 'building')) {
            Schema::table('warehouse_locations', function (Blueprint $table): void {
                $table->dropColumn([
                    'building',
                    'floor',
                    'room',
                    'rack',
                    'shelf',
                    'bin',
                ]);
            });
        }
    }
};
