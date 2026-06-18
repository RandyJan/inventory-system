export type ColumnSort<TData> = {
    id: string;
    desc?: boolean;
};

export type DataTableProps<TData> = {
    columns: any[];
    data: TData[];
    total?: number; // total rows for server-side
    page?: number;
    pageSize?: number;
    loading?: boolean;
    onSortChange?: (sort: ColumnSort<TData>[]) => void;
    onFilterChange?: (filters: Record<string, any>) => void;
    onPageChange?: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    onColumnVisibilityChange?: (visible: Record<string, boolean>) => void;
    onRowSelectionChange?: (selected: string[]) => void;
    serverSide?: boolean;
};

export type ColumnDefType<T> = any;
