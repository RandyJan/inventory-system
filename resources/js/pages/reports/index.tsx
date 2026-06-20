import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import {
    exportMethod as reportExport,
    show as reportShow,
    index as reportsIndex,
} from '@/routes/reports';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    ClipboardList,
    Database,
    FileText,
    PackageSearch,
    ShoppingCart,
} from 'lucide-react';
import { type ReactNode } from 'react';

type ReportCatalog = {
    groups: ReportGroup[];
    summary: {
        total_reports: number;
        ready_reports: number;
        needs_data_reports: number;
        total_records: number;
    };
};

type ReportGroup = {
    key: 'inventory' | 'purchasing' | 'issuance' | 'audit' | string;
    title: string;
    description: string;
    reports: ReportDefinition[];
};

type ReportDefinition = {
    slug: string;
    name: string;
    description: string;
    source: string;
    records_count: number;
    status: 'ready' | 'needs-data' | string;
    value?: number | null;
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Reports',
        href: reportsIndex().url,
    },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
});

const numberFormatter = new Intl.NumberFormat('en-US');

export default function ReportsIndex({ catalog }: { catalog: ReportCatalog }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reports" />

            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold">Reports</h1>
                        <p className="text-sm text-muted-foreground">
                            Inventory, purchasing, issuance, and audit reports
                            for operational review and reconciliation.
                        </p>
                    </div>
                    <Badge variant="outline" className="w-fit">
                        {catalog.summary.ready_reports} ready reports
                    </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total Reports"
                        value={catalog.summary.total_reports}
                        description="Report definitions available"
                        icon={<FileText className="size-4" />}
                    />
                    <SummaryCard
                        title="Ready"
                        value={catalog.summary.ready_reports}
                        description="Backed by current system data"
                        icon={<Database className="size-4" />}
                    />
                    <SummaryCard
                        title="Needs Data"
                        value={catalog.summary.needs_data_reports}
                        description="Requires additional source fields"
                        icon={<PackageSearch className="size-4" />}
                    />
                    <SummaryCard
                        title="Source Records"
                        value={numberFormatter.format(
                            catalog.summary.total_records,
                        )}
                        description="Total reportable records detected"
                        icon={<BarChart3 className="size-4" />}
                    />
                </div>

                <div className="grid gap-4">
                    {catalog.groups.map((group) => (
                        <section key={group.key} className="grid gap-3">
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        {group.title}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        {group.description}
                                    </p>
                                </div>
                                <Badge variant="secondary" className="w-fit">
                                    {group.reports.length} reports
                                </Badge>
                            </div>

                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {group.reports.map((report) => (
                                    <ReportCard
                                        key={report.slug}
                                        report={report}
                                        icon={iconForGroup(group.key)}
                                    />
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: number | string;
    description: string;
    icon: ReactNode;
}) {
    return (
        <Card>
            <CardHeader className="space-y-0 pb-2">
                <CardDescription className="flex items-center gap-2">
                    <span className="text-muted-foreground">{icon}</span>
                    {title}
                </CardDescription>
                <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
            </CardContent>
        </Card>
    );
}

function ReportCard({
    report,
    icon,
}: {
    report: ReportDefinition;
    icon: ReactNode;
}) {
    return (
        <Card className="flex h-full flex-col transition-colors hover:border-foreground/30">
            <Link
                href={reportShow(report.slug).url}
                className="flex flex-1 flex-col rounded-t-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
                <CardHeader className="gap-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-md border text-muted-foreground">
                            {icon}
                        </div>
                        <ReportStatus status={report.status} />
                    </div>
                    <div>
                        <CardTitle className="text-base">
                            {report.name}
                        </CardTitle>
                        <CardDescription className="mt-1">
                            {report.description}
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="grid flex-1 gap-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Source</span>
                        <span className="font-medium">{report.source}</span>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        <span className="text-muted-foreground">Records</span>
                        <span className="font-medium tabular-nums">
                            {numberFormatter.format(report.records_count)}
                        </span>
                    </div>
                    {report.value !== null && report.value !== undefined && (
                        <div className="flex items-center justify-between gap-3">
                            <span className="text-muted-foreground">Value</span>
                            <span className="font-medium tabular-nums">
                                {currencyFormatter.format(report.value)}
                            </span>
                        </div>
                    )}
                </CardContent>
            </Link>
            <div className="mt-auto flex justify-center border-t px-4 py-3">
                <Button asChild size="sm" variant="outline">
                    <a href={reportExport(report.slug).url}>CSV</a>
                </Button>
            </div>
        </Card>
    );
}

function ReportStatus({ status }: { status: string }) {
    if (status === 'ready') {
        return (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
                Ready
            </Badge>
        );
    }

    return <Badge variant="secondary">Needs Data</Badge>;
}

function iconForGroup(groupKey: string): ReactNode {
    if (groupKey === 'purchasing') {
        return <ShoppingCart className="size-4" />;
    }

    if (groupKey === 'issuance') {
        return <ClipboardList className="size-4" />;
    }

    if (groupKey === 'audit') {
        return <Activity className="size-4" />;
    }

    return <PackageSearch className="size-4" />;
}
