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
        Schema::create('approval_steps', function (Blueprint $table) {
            $table->id();
            $table->morphs('approvable');
            $table->foreignId('approval_workflow_id')->constrained()->cascadeOnDelete();
            $table->foreignId('approval_workflow_step_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('level');
            $table->string('name');
            $table->string('role_name')->nullable();
            $table->string('permission_name');
            $table->string('status')->default('pending')->index();
            $table->foreignId('acted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('acted_at')->nullable();
            $table->text('remarks')->nullable();
            $table->timestamps();

            $table->index(['approvable_type', 'approvable_id', 'status']);
            $table->unique(['approvable_type', 'approvable_id', 'level']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_steps');
    }
};
