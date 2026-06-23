import type { ColumnDef } from '@tanstack/react-table';
import {
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    useReactTable,
} from '@tanstack/react-table';
import React from 'react';
import Pagination from './Pagination';
import Toolbar from './Toolbar';
import type { DataTableProps } from './types';

function classNames(...args: Array<string | undefined | false>) {
    return args.filter(Boolean).join(' ');
}

export default function DataTable<TData>({
    columns,
    data,
    total,
    page = 0,
    pageSize = 10,
    loading = false,
    onSortChange,
    onFilterChange,
    onPageChange,
    onPageSizeChange,
    onColumnVisibilityChange,
    onRowSelectionChange,
    serverSide = false,
}: DataTableProps<TData>) {
    const [globalFilter, setGlobalFilter] = React.useState('');
    const [rowSelection, setRowSelection] = React.useState<
        Record<string, boolean>
    >({});
    const [columnVisibility, setColumnVisibility] = React.useState<
        Record<string, boolean>
    >({});

    // prepend selection column
    const selectionColumn: ColumnDef<TData> = React.useMemo(
        () => ({
            id: 'select',
            header: ({ table }) => (
                <input
                    type="checkbox"
                    checked={table.getIsAllPageRowsSelected()}
                    onChange={table.getToggleAllPageRowsSelectedHandler()}
                />
            ),
            cell: ({ row }) => (
                <input
                    type="checkbox"
                    checked={row.getIsSelected()}
                    onChange={row.getToggleSelectedHandler()}
                />
            ),
            size: 32,
        }),
        [],
    );

    const cols = React.useMemo(
        () => [selectionColumn, ...(columns as ColumnDef<TData>[])],
        [columns, selectionColumn],
    );

    const table = useReactTable({
        data: data ?? [],
        columns: cols,
        state: {
            globalFilter,
            rowSelection,
            columnVisibility,
            pagination: { pageIndex: page, pageSize },
        },
        onGlobalFilterChange: (v) => {
            setGlobalFilter(v as string);
            onFilterChange?.({ global: v });
        },
        onRowSelectionChange: setRowSelection,
        onColumnVisibilityChange: setColumnVisibility,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: serverSide,
        pageCount:
            serverSide && total
                ? Math.max(1, Math.ceil(total / pageSize))
                : undefined,
    });

    // notify parent about selection changes (emit selected row IDs)
    React.useEffect(() => {
        const selected = Object.keys(rowSelection).filter(
            (k) => rowSelection[k],
        );
        onRowSelectionChange?.(selected);
    }, [rowSelection]);

    React.useEffect(() => {
        onColumnVisibilityChange?.(columnVisibility);
    }, [columnVisibility]);

    // sync external page props (server-side)
    React.useEffect(() => {
        if (serverSide) {
            table.setPageIndex(page);
        }
    }, [page]);

    React.useEffect(() => {
        if (serverSide) {
            table.setPageSize(pageSize);
        }
    }, [pageSize]);

    React.useEffect(() => {
        if (onPageChange) onPageChange(table.getState().pagination.pageIndex);
    }, [table.getState().pagination.pageIndex]);

    React.useEffect(() => {
        if (onPageSizeChange)
            onPageSizeChange(table.getState().pagination.pageSize);
    }, [table.getState().pagination.pageSize]);

    return (
        <div className="w-full">
            <Toolbar
                globalFilter={globalFilter}
                setGlobalFilter={setGlobalFilter}
                columns={((columns as any[]) ?? []).map((c) => ({
                    id: c.accessorKey ?? c.id ?? String(c.header),
                    header:
                        typeof c.header === 'string'
                            ? c.header
                            : String(c.header),
                }))}
                columnVisibility={columnVisibility}
                toggleColumn={(id) =>
                    setColumnVisibility((s) => ({ ...s, [id]: !s[id] }))
                }
                selectedCount={
                    Object.keys(table.getState().rowSelection ?? {}).length
                }
            />

            <div className="overflow-auto rounded border">
                <table className="min-w-full table-auto text-sm">
                    <thead className="bg-gray-50 text-left">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <th
                                        key={header.id}
                                        className="px-3 py-2 align-bottom"
                                    >
                                        {header.isPlaceholder ? null : (
                                            <div
                                                {...{
                                                    onClick:
                                                        header.column.getToggleSortingHandler(),
                                                    className: classNames(
                                                        'flex items-center gap-2 cursor-pointer select-none',
                                                        header.column.getCanSort()
                                                            ? ''
                                                            : 'cursor-default',
                                                    ),
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef
                                                        .header,
                                                    header.getContext(),
                                                )}
                                                {{
                                                    asc: ' 🔼',
                                                    desc: ' 🔽',
                                                }[
                                                    header.column.getIsSorted() as string
                                                ] ?? null}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={cols.length}
                                    className="p-6 text-center"
                                >
                                    Loading...
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className="border-t even:bg-gray-50"
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td
                                            key={cell.id}
                                            className="px-3 py-2 align-top"
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={cols.length}
                                    className="p-6 text-center text-sm text-muted-foreground"
                                >
                                    No data
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Pagination
                pageCount={
                    serverSide && total
                        ? Math.max(1, Math.ceil(total / pageSize))
                        : table.getPageCount()
                }
                pageIndex={table.getState().pagination.pageIndex}
                pageSize={table.getState().pagination.pageSize}
                gotoPage={(i) => table.setPageIndex(i)}
                previousPage={() => table.previousPage()}
                nextPage={() => table.nextPage()}
                setPageSize={(s) => table.setPageSize(s)}
            />
        </div>
    );
}
