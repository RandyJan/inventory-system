import React from 'react';

type Props = {
    pageCount: number;
    pageIndex: number;
    pageSize: number;
    gotoPage: (i: number) => void;
    previousPage: () => void;
    nextPage: () => void;
    setPageSize: (s: number) => void;
};

export default function Pagination({ pageCount, pageIndex, pageSize, gotoPage, previousPage, nextPage, setPageSize }: Props) {
    return (
        <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-2">
                <button onClick={() => gotoPage(0)} className="px-2 py-1 border rounded">First</button>
                <button onClick={previousPage} className="px-2 py-1 border rounded">Prev</button>
                <span className="px-2">Page {pageIndex + 1} of {pageCount}</span>
                <button onClick={nextPage} className="px-2 py-1 border rounded">Next</button>
                <button onClick={() => gotoPage(pageCount - 1)} className="px-2 py-1 border rounded">Last</button>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm">Rows:</label>
                <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="px-2 py-1 border rounded">
                    {[10, 20, 50, 100].map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </div>
        </div>
    );
}
