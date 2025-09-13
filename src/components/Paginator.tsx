import {Button} from "@/components/ui/button";
import React from "react";

export const ListControls = ({page, size, direction, total, onSizeChange, onDirectionChange}: {
    page: number
    size: number
    direction: "asc" | "desc"
    total: number
    onSizeChange: (s: number) => void
    onDirectionChange: (d: "asc" | "desc") => void
}) => {
    return (
        <div className="flex items-center justify-between mb-4 bg-muted/30 px-4 py-2 rounded-md">
            <span className="text-sm text-muted-foreground">
                Showing page {page + 1}, total {total} results
            </span>
            <div className="flex gap-2">
                <select value={size}
                        onChange={(e) => onSizeChange(Number(e.target.value))}
                        className="border rounded px-2 py-1 text-sm"
                >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                <select
                    value={direction}
                    onChange={(e) => onDirectionChange(e.target.value as "asc" | "desc")}
                    className="border rounded px-2 py-1 text-sm">
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                </select>
            </div>
        </div>
    )
}

export const Paginator = ({page, size, total, onPageChange}: {
    page: number,
    size: number,
    total: number,
    onPageChange: (p: number) => void
}) => {
    const totalPages = Math.ceil(total / size)
    return (
        <div className="flex justify-center items-center gap-4 mt-6">
            <Button
                variant="outline" size="sm" disabled={page === 0}
                onClick={() => onPageChange(page - 1)}>
                Previous
            </Button>
            <span className="text-sm">
        Page {page + 1} of {totalPages || 1}
      </span>
            <Button variant="outline" size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => onPageChange(page + 1)}>
                Next
            </Button>
        </div>
    )
}