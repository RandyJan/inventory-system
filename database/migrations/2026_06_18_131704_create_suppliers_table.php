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
        Schema::create('suppliers', function (Blueprint $table): void {
            $table->id();
            $table->string('supplier_code', 50)->unique();
            $table->string('company_name');
            $table->string('contact_person')->nullable();
            $table->string('email_address')->nullable();
            $table->string('phone_number')->nullable();
            $table->text('address')->nullable();
            $table->string('tax_identification_number', 100)->nullable()->unique();
            $table->string('status', 40)->default('active')->index();
            $table->unsignedInteger('total_orders')->default(0);
            $table->unsignedInteger('fulfilled_orders')->default(0);
            $table->unsignedInteger('late_deliveries')->default(0);
            $table->decimal('performance_score', 5, 2)->nullable();
            $table->timestamp('last_delivery_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['company_name', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('suppliers');
    }
};
