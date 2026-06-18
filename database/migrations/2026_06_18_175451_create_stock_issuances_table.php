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
        Schema::create('stock_issuances', function (Blueprint $table) {
            $table->id();
            $table->string('issue_number')->unique();
            $table->string('requesting_department')->index();
            $table->string('requestor');
            $table->date('date_issued')->index();
            $table->foreignId('released_by')->constrained('users')->restrictOnDelete();
            $table->decimal('total_quantity_issued', 12, 2)->default(0);
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_issuances');
    }
};
