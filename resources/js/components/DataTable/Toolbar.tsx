import React from 'react';

type ColumnVisibility = Record<string, boolean>;

type ColumnItem = {
    id: string;
    header: string;
};

type Props = {
    globalFilter: string;
    setGlobalFilter: (v: string) => void;
    columns?: ColumnItem[];
    columnVisibility?: ColumnVisibility;
    toggleColumn?: (id: string) => void;
    selectedCount?: number;
};

export default function Toolbar({
    globalFilter,
    setGlobalFilter,
    columns = [],
    columnVisibility = {},
    toggleColumn,
    selectedCount = 0,
}: Props) {
    return (
        <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
                <input
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    placeholder="Search..."
                    className="px-3 py-2 border rounded-md"
                />
                <div className="text-sm text-muted-foreground">{selectedCount} selected</div>
            </div>
            <div className="flex items-center gap-2">
                <div className="relative inline-block text-left">
                    <details className="relative">
                        <summary className="px-3 py-2 bg-gray-100 rounded cursor-pointer">Columns</summary>
                        <div className="absolute right-0 mt-2 w-48 rounded border bg-white shadow z-10 p-2">
                            {columns.map((col) => (
                                <label key={col.id} className="flex items-center gap-2 p-1">
                                    <input
                                        type="checkbox"
                                        checked={columnVisibility[col.id] ?? true}
                                        onChange={() => toggleColumn?.(col.id)}
                                    />
                                    <span className="text-sm">{col.header}</span>
                                </label>
                            ))}
                        </div>
                    </details>
                </div>

                <button className="px-3 py-2 bg-indigo-600 text-white rounded">Export</button>
            </div>
        </div>
    );
}
