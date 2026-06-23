type Props = {
    pageCount: number;
    pageIndex: number;
    pageSize: number;
    gotoPage: (i: number) => void;
    previousPage: () => void;
    nextPage: () => void;
    setPageSize: (s: number) => void;
};

export default function Pagination({
    pageCount,
    pageIndex,
    pageSize,
    gotoPage,
    previousPage,
    nextPage,
    setPageSize,
}: Props) {
    return (
        <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <button
                    onClick={() => gotoPage(0)}
                    className="rounded border px-2 py-1"
                >
                    First
                </button>
                <button
                    onClick={previousPage}
                    className="rounded border px-2 py-1"
                >
                    Prev
                </button>
                <span className="px-2">
                    Page {pageIndex + 1} of {pageCount}
                </span>
                <button onClick={nextPage} className="rounded border px-2 py-1">
                    Next
                </button>
                <button
                    onClick={() => gotoPage(pageCount - 1)}
                    className="rounded border px-2 py-1"
                >
                    Last
                </button>
            </div>
            <div className="flex items-center gap-2">
                <label className="text-sm">Rows:</label>
                <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="rounded border px-2 py-1"
                >
                    {[10, 20, 50, 100].map((s) => (
                        <option key={s} value={s}>
                            {s}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
