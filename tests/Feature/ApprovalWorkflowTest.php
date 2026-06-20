<?php

use App\Models\ApprovalWorkflow;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

beforeEach(function (): void {
    app(PermissionRegistrar::class)->forgetCachedPermissions();
});

function approvalWorkflowActor(string ...$permissions): User
{
    $actor = User::factory()->create();

    collect($permissions)->each(fn (string $permission): Permission => Permission::firstOrCreate([
        'name' => $permission,
        'guard_name' => 'web',
    ]));

    $actor->givePermissionTo($permissions);

    return $actor;
}

test('authorized users can view approval workflow module', function (): void {
    $actor = approvalWorkflowActor('approval-workflows.view');
    $workflow = ApprovalWorkflow::factory()->create([
        'name' => 'Stock Transfer Approval',
        'workflow_type' => ApprovalWorkflow::TYPE_STOCK_TRANSFER,
    ]);
    $workflow->steps()->createMany([
        [
            'level' => 1,
            'name' => 'Supervisor',
            'role_name' => 'Supervisor',
            'permission_name' => 'stock-transfers.approve.supervisor',
        ],
        [
            'level' => 2,
            'name' => 'Department Head',
            'role_name' => 'Department Head',
            'permission_name' => 'stock-transfers.approve.department-head',
        ],
    ]);

    $this->actingAs($actor)
        ->get(route('approval-workflows.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('approval-workflows/index')
            ->has('workflows', 1)
            ->where('workflows.0.steps.0.name', 'Supervisor')
            ->has('workflowTypes'));
});

test('authorized users can create approval workflows with levels', function (): void {
    $actor = approvalWorkflowActor('approval-workflows.manage');

    $this->actingAs($actor)
        ->post(route('approval-workflows.store'), [
            'name' => 'Stock Transfer Approval',
            'workflow_type' => ApprovalWorkflow::TYPE_STOCK_TRANSFER,
            'description' => 'Request > Supervisor > Department Head > Inventory Manager',
            'is_active' => true,
            'steps' => [
                [
                    'name' => 'Supervisor',
                    'role_name' => 'Supervisor',
                    'permission_name' => 'stock-transfers.approve.supervisor',
                ],
                [
                    'name' => 'Department Head',
                    'role_name' => 'Department Head',
                    'permission_name' => 'stock-transfers.approve.department-head',
                ],
                [
                    'name' => 'Inventory Manager',
                    'role_name' => 'Inventory Manager',
                    'permission_name' => 'stock-transfers.approve.inventory-manager',
                ],
            ],
        ])
        ->assertRedirect();

    $this->assertDatabaseHas('approval_workflows', [
        'workflow_type' => ApprovalWorkflow::TYPE_STOCK_TRANSFER,
        'name' => 'Stock Transfer Approval',
    ]);

    $this->assertDatabaseHas('approval_workflow_steps', [
        'level' => 3,
        'name' => 'Inventory Manager',
        'permission_name' => 'stock-transfers.approve.inventory-manager',
    ]);
});
