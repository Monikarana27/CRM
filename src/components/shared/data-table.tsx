"use client";

import { useMemo, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  accessor?: (row: T) => string | number;
  width?: number; // px width, needed for sticky offset math
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  pageSize?: number;
  emptyMessage?: string;
  /** Number of leading columns to freeze (pinned while scrolling horizontally) */
  frozenColumnCount?: number;
  /** Row click opens detail drawer, etc. Ignored if the click originated in an Actions cell (data-no-row-click). */
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends { id: string }>({
  data,
  columns,
  searchPlaceholder = "Search...",
  pageSize = 10,
  emptyMessage = "No records found.",
  frozenColumnCount = 0,
  onRowClick,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const value = col.accessor ? col.accessor(row) : (row as any)[col.key];
        return String(value ?? "").toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    const col = columns.find((c) => c.key === sortKey);
    if (!col) return filtered;
    return [...filtered].sort((a, b) => {
      const av = col.accessor ? col.accessor(a) : (a as any)[sortKey];
      const bv = col.accessor ? col.accessor(b) : (b as any)[sortKey];
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir, columns]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(1);
  }

  // Cumulative left offsets for frozen columns. Falls back to a sane
  // default width if a frozen column doesn't declare one.
  const DEFAULT_COL_WIDTH = 160;
  const leftOffsets = useMemo(() => {
    const offsets: number[] = [];
    let running = 0;
    for (let i = 0; i < columns.length; i++) {
      offsets[i] = running;
      if (i < frozenColumnCount) {
        running += columns[i].width ?? DEFAULT_COL_WIDTH;
      }
    }
    return offsets;
  }, [columns, frozenColumnCount]);

  function stickyStyle(index: number): React.CSSProperties | undefined {
    if (index >= frozenColumnCount) return undefined;
    const isLastFrozen = index === frozenColumnCount - 1;
    return {
      position: "sticky",
      left: leftOffsets[index],
      zIndex: 20 - index, // earlier columns stack above later ones
      width: columns[index].width ?? DEFAULT_COL_WIDTH,
      minWidth: columns[index].width ?? DEFAULT_COL_WIDTH,
      boxShadow: isLastFrozen ? "2px 0 4px -2px rgba(0,0,0,0.15)" : undefined,
    };
  }

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder={searchPlaceholder}
          className="pl-9"
        />
      </div>

      {/* overflow-x-auto is required for sticky-left to have something to scroll within */}
      <div className="w-full overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col, i) => (
                <TableHead
                  key={col.key}
                  className={cn(i < frozenColumnCount && "bg-background")}
                  style={stickyStyle(i)}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="flex items-center gap-1 hover:text-foreground"
                    >
                      {col.header}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row) => (
                <TableRow
                  key={row.id}
                  className={cn(onRowClick && "cursor-pointer hover:bg-muted/50")}
                  onClick={(e) => {
                    if (!onRowClick) return;
                    // don't trigger the drawer when the click came from an
                    // Actions cell (buttons, dropdowns, etc.)
                    const target = e.target as HTMLElement;
                    if (target.closest("[data-no-row-click]")) return;
                    onRowClick(row);
                  }}
                >
                  {columns.map((col, i) => (
                    <TableCell
                      key={col.key}
                      className={cn(i < frozenColumnCount && "bg-background")}
                      style={stickyStyle(i)}
                    >
                      {col.render ? col.render(row) : (row as any)[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {sorted.length === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, sorted.length)} of {sorted.length}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}