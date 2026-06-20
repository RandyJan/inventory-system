import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { show as auditShow, index as auditsIndex } from '@/routes/audits';
import { BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Clock4, FileJson2, UserRound } from 'lucide-react';

type ActivityRecord = {
    id: number;
    description: string;
    log_name: string | null;
    properties: Record<string, unknown> | null;
    created_at: string;
    causer?: {
        id: number;
        name: string;
        email?: string | null;
    } | null;
};

export default function AuditShow({ activity }: { activity: ActivityRecord }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Audit Logs',
            href: auditsIndex().url,
        },
        {
            title: `Record #${activity.id}`,
            href: auditShow(activity.id).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Activity #${activity.id}`} />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div>
                    <h1 className="text-2xl font-semibold">
                        Audit Record #{activity.id}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        A readable summary for non-technical users, with
                        technical JSON available below.
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Activity Type</CardDescription>
                            <CardTitle className="text-base">
                                {toReadableTitle(activity.description)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <FileJson2 className="size-4" />
                                {(activity.log_name ?? 'general').replaceAll(
                                    '-',
                                    ' ',
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Actor</CardDescription>
                            <CardTitle className="text-base">
                                {activity.causer?.name ?? 'System'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <UserRound className="size-4" />
                                {activity.causer?.email ?? 'No email available'}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="gap-2 py-4">
                        <CardHeader className="px-4 pb-0">
                            <CardDescription>Date & Time</CardDescription>
                            <CardTitle className="text-base">
                                {formatDateTime(activity.created_at)}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-4 pt-0 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Clock4 className="size-4" />
                                Event timestamp
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="gap-3 py-4">
                    <CardHeader className="px-4">
                        <CardTitle className="text-base">
                            Readable Details
                        </CardTitle>
                        <CardDescription>
                            {toReadableSentence(activity)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 px-4 text-sm">
                        {toReadablePropertyItems(activity.properties).map(
                            (item) => (
                                <p key={item.label}>
                                    <span className="font-medium text-foreground">
                                        {item.label}:{' '}
                                    </span>
                                    <span className="text-muted-foreground">
                                        {item.value}
                                    </span>
                                </p>
                            ),
                        )}
                    </CardContent>
                </Card>

                <Card className="gap-3 py-4">
                    <CardHeader className="px-4">
                        <CardTitle className="text-base">
                            Old and New Values
                        </CardTitle>
                        <CardDescription>
                            Tracked values captured with this activity.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-3 px-4 md:grid-cols-2">
                        {toReadableChangeItems(activity.properties).map(
                            (change) => (
                                <div
                                    key={change.label}
                                    className="rounded-md border p-3 text-sm"
                                >
                                    <p className="font-medium text-foreground">
                                        {change.label}
                                    </p>
                                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                Old Value
                                            </p>
                                            <p>{change.oldValue}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">
                                                New Value
                                            </p>
                                            <p>{change.newValue}</p>
                                        </div>
                                    </div>
                                </div>
                            ),
                        )}
                        {toReadableChangeItems(activity.properties).length ===
                            0 && (
                            <p className="text-sm text-muted-foreground">
                                No old or new values were captured for this
                                activity.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="gap-3 py-4">
                    <CardHeader className="px-4">
                        <CardTitle className="text-base">
                            Technical Data
                        </CardTitle>
                        <CardDescription>
                            Raw properties and full JSON for admins and
                            developers.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 px-4 lg:grid-cols-2">
                        <div>
                            <h2 className="text-sm font-medium">
                                Properties JSON
                            </h2>
                            <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-5">
                                {JSON.stringify(
                                    activity.properties ?? {},
                                    null,
                                    2,
                                )}
                            </pre>
                        </div>

                        <div>
                            <h2 className="text-sm font-medium">Full JSON</h2>
                            <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-5">
                                {JSON.stringify(activity, null, 2)}
                            </pre>
                        </div>
                    </CardContent>
                </Card>

                <div>
                    <Badge variant="outline">
                        Raw description: {activity.description}
                    </Badge>
                </div>
            </div>
        </AppLayout>
    );
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function toReadableTitle(description: string): string {
    if (/logged in/i.test(description)) {
        return 'User signed in';
    }

    if (/logged out/i.test(description)) {
        return 'User signed out';
    }

    if (/changed user role/i.test(description)) {
        return 'User role was updated';
    }

    if (/activated user/i.test(description)) {
        return 'User account was activated';
    }

    if (/deactivated user/i.test(description)) {
        return 'User account was deactivated';
    }

    return description;
}

function toReadableSentence(activity: ActivityRecord): string {
    const actor = activity.causer?.name ?? 'System';

    if (/logged in/i.test(activity.description)) {
        return `${actor} signed in to the system.`;
    }

    if (/logged out/i.test(activity.description)) {
        return `${actor} signed out of the system.`;
    }

    if (activity.log_name === 'inventory-tracking') {
        const action =
            extractProperty(activity.properties, 'action') ??
            activity.description;

        return `${actor} performed inventory action: ${toHeadline(action.replaceAll('-', ' '))}.`;
    }

    return `${actor} performed this activity: ${activity.description}.`;
}

function toReadableChangeItems(
    properties: ActivityRecord['properties'],
): Array<{ label: string; oldValue: string; newValue: string }> {
    if (!properties || typeof properties !== 'object') {
        return [];
    }

    const oldValues = (properties as Record<string, unknown>).old_values;
    const newValues = (properties as Record<string, unknown>).new_values;

    if (!isRecord(oldValues) && !isRecord(newValues)) {
        return [];
    }

    const oldRecord = isRecord(oldValues) ? oldValues : {};
    const newRecord = isRecord(newValues) ? newValues : {};
    const keys = Array.from(
        new Set([...Object.keys(oldRecord), ...Object.keys(newRecord)]),
    ).filter(
        (key) => !key.endsWith('.item') && !key.endsWith('.unit_of_measure'),
    );

    return keys.map((key) => ({
        label: toReadableChangeLabel(key, newRecord),
        oldValue: toReadableValue(oldRecord[key]),
        newValue: toReadableValue(newRecord[key]),
    }));
}

function toReadableChangeLabel(
    key: string,
    newValues: Record<string, unknown>,
): string {
    const itemPrefix = key.match(/^items\.(\d+)\./);
    const field = toHeadline(
        key.split('.').at(-1)?.replaceAll('_', ' ') ?? key,
    );

    if (!itemPrefix) {
        return field;
    }

    const itemLabel = newValues[`items.${itemPrefix[1]}.item`];

    return `${toReadableValue(itemLabel)} - ${field}`;
}

function toReadablePropertyItems(
    properties: ActivityRecord['properties'],
): Array<{ label: string; value: string }> {
    if (!properties || typeof properties !== 'object') {
        return [{ label: 'Details', value: 'No extra details available.' }];
    }

    const entries = Object.entries(properties);

    if (entries.length === 0) {
        return [{ label: 'Details', value: 'No extra details available.' }];
    }

    return entries.slice(0, 10).map(([key, value]) => ({
        label: toHeadline(key.replaceAll('_', ' ')),
        value: toReadableValue(value),
    }));
}

function toReadableValue(value: unknown): string {
    if (value === null || value === undefined) {
        return 'None';
    }

    if (Array.isArray(value)) {
        if (value.length === 0) {
            return 'None';
        }

        return value.map((item) => String(item)).join(', ');
    }

    if (typeof value === 'object') {
        return JSON.stringify(value);
    }

    return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function toHeadline(value: string): string {
    return value
        .split(' ')
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

function extractProperty(
    properties: ActivityRecord['properties'],
    path: string,
): string | null {
    if (!properties || typeof properties !== 'object') {
        return null;
    }

    const parts = path.split('.');
    let cursor: unknown = properties;

    for (const part of parts) {
        if (
            cursor === null ||
            typeof cursor !== 'object' ||
            !(part in (cursor as Record<string, unknown>))
        ) {
            return null;
        }

        cursor = (cursor as Record<string, unknown>)[part];
    }

    return cursor === null || cursor === undefined ? null : String(cursor);
}
