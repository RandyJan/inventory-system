import ApprovalWorkflowController from '@/actions/App/Http/Controllers/ApprovalWorkflowController';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { index as approvalWorkflowsIndex } from '@/routes/approval-workflows';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import { GitPullRequestArrow, Pencil, Plus, Trash2 } from 'lucide-react';
import { type FormEvent, type ReactNode, useState } from 'react';

type WorkflowStep = {
    id?: number;
    level: number;
    name: string;
    role_name?: string | null;
    permission_name: string;
};

type ApprovalWorkflow = {
    id: number;
    name: string;
    workflow_type: string;
    description?: string | null;
    is_active: boolean;
    steps: WorkflowStep[];
};

type WorkflowType = {
    value: string;
    label: string;
};

type WorkflowFormData = {
    name: string;
    workflow_type: string;
    description: string;
    is_active: boolean;
    steps: {
        name: string;
        role_name: string;
        permission_name: string;
    }[];
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Approval Workflows', href: approvalWorkflowsIndex().url },
];

export default function ApprovalWorkflowsIndex({
    workflows,
    workflowTypes,
}: {
    workflows: ApprovalWorkflow[];
    workflowTypes: WorkflowType[];
}) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Approval Workflows" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            Approval Workflows
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {workflows.length} configured workflows
                        </p>
                    </div>

                    <WorkflowFormDialog workflowTypes={workflowTypes} />
                </div>

                <div className="overflow-hidden rounded-lg border border-sidebar-border/70 dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Workflow</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Levels</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {workflows.map((workflow) => (
                                <TableRow key={workflow.id}>
                                    <TableCell className="min-w-56">
                                        <div className="font-medium">
                                            {workflow.name}
                                        </div>
                                        {workflow.description && (
                                            <div className="text-sm text-muted-foreground">
                                                {workflow.description}
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {workflow.workflow_type}
                                    </TableCell>
                                    <TableCell>
                                        <WorkflowLevelBadges
                                            steps={workflow.steps}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                workflow.is_active
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {workflow.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex justify-end">
                                            <WorkflowFormDialog
                                                workflow={workflow}
                                                workflowTypes={workflowTypes}
                                            />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {workflows.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="h-24 text-center text-muted-foreground"
                                    >
                                        No approval workflows found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AppLayout>
    );
}

function WorkflowFormDialog({
    workflow,
    workflowTypes,
}: {
    workflow?: ApprovalWorkflow;
    workflowTypes: WorkflowType[];
}) {
    const [open, setOpen] = useState(false);
    const form = useForm<WorkflowFormData>(workflowDefaults(workflow));

    function openDialog(nextOpen: boolean) {
        setOpen(nextOpen);

        if (nextOpen) {
            form.clearErrors();
            form.setData(workflowDefaults(workflow));
        }
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const options = {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setOpen(false);
            },
        };

        if (workflow) {
            form.put(
                ApprovalWorkflowController.update(workflow.id).url,
                options,
            );

            return;
        }

        form.post(ApprovalWorkflowController.store().url, options);
    }

    function updateStep(
        index: number,
        field: keyof WorkflowFormData['steps'][number],
        value: string,
    ) {
        form.setData(
            'steps',
            form.data.steps.map((step, stepIndex) =>
                stepIndex === index ? { ...step, [field]: value } : step,
            ),
        );
    }

    function addStep() {
        form.setData('steps', [
            ...form.data.steps,
            { name: '', role_name: '', permission_name: '' },
        ]);
    }

    function removeStep(index: number) {
        if (form.data.steps.length === 1) {
            return;
        }

        form.setData(
            'steps',
            form.data.steps.filter((_, stepIndex) => stepIndex !== index),
        );
    }

    return (
        <Dialog open={open} onOpenChange={openDialog}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant={workflow ? 'outline' : 'default'}
                    size={workflow ? 'sm' : 'default'}
                >
                    {workflow ? <Pencil /> : <Plus />}
                    {workflow ? 'Edit' : 'New workflow'}
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-4xl">
                <DialogHeader>
                    <DialogTitle>
                        {workflow ? 'Edit workflow' : 'New workflow'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">
                        Approval workflow form
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={submit} className="space-y-5">
                    <div className="grid gap-4 md:grid-cols-2">
                        <Field
                            id={
                                workflow
                                    ? `workflow-${workflow.id}`
                                    : 'workflow-new'
                            }
                            label="Name"
                            error={form.errors.name}
                        >
                            <Input
                                id={
                                    workflow
                                        ? `workflow-${workflow.id}`
                                        : 'workflow-new'
                                }
                                value={form.data.name}
                                onChange={(event) =>
                                    form.setData('name', event.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field
                            label="Workflow Type"
                            error={form.errors.workflow_type}
                        >
                            <Select
                                value={form.data.workflow_type}
                                onValueChange={(value) =>
                                    form.setData('workflow_type', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {workflowTypes.map((type) => (
                                        <SelectItem
                                            key={type.value}
                                            value={type.value}
                                        >
                                            {type.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                    </div>

                    <Field label="Description" error={form.errors.description}>
                        <Textarea
                            value={form.data.description}
                            onChange={(event) =>
                                form.setData('description', event.target.value)
                            }
                            rows={3}
                        />
                    </Field>

                    <label className="flex items-center gap-3 rounded-md border p-3">
                        <Checkbox
                            checked={form.data.is_active}
                            onCheckedChange={(checked) =>
                                form.setData('is_active', checked === true)
                            }
                        />
                        <span className="text-sm font-medium">Active</span>
                    </label>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between gap-3">
                            <Label>Approval Levels</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addStep}
                            >
                                <Plus className="size-4" />
                                Add level
                            </Button>
                        </div>
                        <InputError message={form.errors.steps} />

                        <div className="space-y-3">
                            {form.data.steps.map((step, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 rounded-md border p-3 md:grid-cols-[64px_1fr_1fr_1fr_auto]"
                                >
                                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                        <GitPullRequestArrow className="size-4" />
                                        L{index + 1}
                                    </div>
                                    <Field
                                        label="Level Name"
                                        error={
                                            form.errors[
                                                `steps.${index}.name` as keyof typeof form.errors
                                            ]
                                        }
                                    >
                                        <Input
                                            value={step.name}
                                            onChange={(event) =>
                                                updateStep(
                                                    index,
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Supervisor"
                                            required
                                        />
                                    </Field>
                                    <Field
                                        label="Role"
                                        error={
                                            form.errors[
                                                `steps.${index}.role_name` as keyof typeof form.errors
                                            ]
                                        }
                                    >
                                        <Input
                                            value={step.role_name}
                                            onChange={(event) =>
                                                updateStep(
                                                    index,
                                                    'role_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Supervisor"
                                        />
                                    </Field>
                                    <Field
                                        label="Permission"
                                        error={
                                            form.errors[
                                                `steps.${index}.permission_name` as keyof typeof form.errors
                                            ]
                                        }
                                    >
                                        <Input
                                            value={step.permission_name}
                                            onChange={(event) =>
                                                updateStep(
                                                    index,
                                                    'permission_name',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="stock-transfers.approve.supervisor"
                                            required
                                        />
                                    </Field>
                                    <div className="flex items-end">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="icon"
                                            disabled={
                                                form.data.steps.length === 1
                                            }
                                            onClick={() => removeStep(index)}
                                        >
                                            <Trash2 className="size-4" />
                                            <span className="sr-only">
                                                Remove level
                                            </span>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function WorkflowLevelBadges({ steps }: { steps: WorkflowStep[] }) {
    return (
        <div className="flex max-w-2xl flex-wrap gap-1.5">
            {steps.map((step) => (
                <Badge key={`${step.level}-${step.name}`} variant="secondary">
                    {step.level}. {step.name}
                </Badge>
            ))}
        </div>
    );
}

function Field({
    id,
    label,
    error,
    children,
}: {
    id?: string;
    label: string;
    error?: string;
    children: ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function workflowDefaults(workflow?: ApprovalWorkflow): WorkflowFormData {
    return {
        name: workflow?.name ?? '',
        workflow_type: workflow?.workflow_type ?? 'stock_transfer',
        description: workflow?.description ?? '',
        is_active: workflow?.is_active ?? true,
        steps:
            workflow?.steps.map((step) => ({
                name: step.name,
                role_name: step.role_name ?? '',
                permission_name: step.permission_name,
            })) ?? defaultSteps(),
    };
}

function defaultSteps(): WorkflowFormData['steps'] {
    return [
        {
            name: 'Supervisor',
            role_name: 'Supervisor',
            permission_name: 'stock-transfers.approve.supervisor',
        },
        {
            name: 'Department Head',
            role_name: 'Department Head',
            permission_name: 'stock-transfers.approve.department-head',
        },
        {
            name: 'Inventory Manager',
            role_name: 'Inventory Manager',
            permission_name: 'stock-transfers.approve.inventory-manager',
        },
    ];
}
