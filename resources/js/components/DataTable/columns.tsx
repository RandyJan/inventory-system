import { ColumnDef } from '@tanstack/react-table';

// Example factory for common columns. Consumer can import and extend.
export const createTextColumn = <T,>(id: string, header: string): ColumnDef<T> => ({
    accessorKey: id,
    header: header,
});

export default createTextColumn;
