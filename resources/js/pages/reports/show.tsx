import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import {
    exportMethod as reportExport,
    show as reportShow,
    index as reportsIndex,
} from '@/routes/reports';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Download, Printer } from 'lucide-react';

type ReportDetail = {
    report: {
        slug: string;
        name: string;
        description: string;
        source: string;
        records_count: number;
        status: string;
        value?: number | null;
    };
    columns: Array<{
        key: string;
        label: string;
        align?: string;
    }>;
    rows: Array<Record<string, string | number | null>>;
    summary: Array<{
        label: string;
        value: string | number;
    }>;
    generated_at: string;
    export_filename: string;
};

const numberFormatter = new Intl.NumberFormat('en-US');

export default function ReportShow({ detail }: { detail: ReportDetail }) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Reports',
            href: reportsIndex().url,
        },
        {
            title: detail.report.name,
            href: reportShow(detail.report.slug).url,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={detail.report.name} />

            <div className="flex flex-1 flex-col gap-4 p-4 print:p-0">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between print:hidden">
                    <div>
                        <h1 className="text-2xl font-semibold">
                            {detail.report.name}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {detail.report.description}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                            <Link href={reportsIndex().url}>
                                <ArrowLeft className="size-4" />
                                Reports
                            </Link>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                        >
                            <Printer className="size-4" />
                            Print
                        </Button>
                        <Button asChild size="sm">
                            <a href={reportExport(detail.report.slug).url}>
                                <Download className="size-4" />
                                CSV
                            </a>
                        </Button>
                    </div>
                </div>

                <div className="hidden print:block">
                    <h1 className="text-xl font-semibold">
                        {detail.report.name}
                    </h1>
                    <p className="text-sm">{detail.report.description}</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard label="Source" value={detail.report.source} />
                    <SummaryCard
                        label="Rows"
                        value={numberFormatter.format(detail.rows.length)}
                    />
                    <SummaryCard
                        label="Status"
                        value={
                            detail.report.status === 'ready'
                                ? 'Ready'
                                : 'Needs Data'
                        }
                    />
                    <SummaryCard
                        label="Generated"
                        value={formatDateTime(detail.generated_at)}
                    />
                </div>

                {detail.summary.length > 0 && (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        {detail.summary.map((summary) => (
                            <SummaryCard
                                key={summary.label}
                                label={summary.label}
                                value={summary.value}
                            />
                        ))}
                    </div>
                )}

                <Card className="print:border-0 print:shadow-none">
                    <CardHeader className="print:px-0">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Report Rows</CardTitle>
                                <CardDescription>
                                    {numberFormatter.format(detail.rows.length)}{' '}
                                    rows included
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="w-fit">
                                {detail.export_filename}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="print:px-0">
                        <div className="overflow-auto rounded-md border print:overflow-visible print:rounded-none print:border-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        {detail.columns.map((column) => (
                                            <TableHead
                                                key={column.key}
                                                className={
                                                    column.align === 'right'
                                                        ? 'text-right'
                                                        : undefined
                                                }
                                            >
                                                {column.label}
                                            </TableHead>
                                        ))}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {detail.rows.map((row, rowIndex) => (
                                        <TableRow key={rowIndex}>
                                            {detail.columns.map((column) => (
                                                <TableCell
                                                    key={column.key}
                                                    className={
                                                        column.align === 'right'
                                                            ? 'text-right tabular-nums'
                                                            : undefined
                                                    }
                                                >
                                                    {formatValue(
                                                        row[column.key],
                                                    )}
                                                </TableCell>
                                            ))}
                                        </TableRow>
                                    ))}
                                    {detail.rows.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={detail.columns.length}
                                                className="h-28 text-center text-muted-foreground"
                                            >
                                                No rows available.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

function SummaryCard({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <Card className="print:break-inside-avoid">
            <CardHeader className="space-y-0 pb-2">
                <CardDescription>{label}</CardDescription>
                <CardTitle className="text-xl">{value}</CardTitle>
            </CardHeader>
        </Card>
    );
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined || value === '') {
        return '—';
    }

    if (typeof value === 'number') {
        return numberFormatter.format(value);
    }

    return value;
}
