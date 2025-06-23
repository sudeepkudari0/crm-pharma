"use client";

import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DataTablePagination } from "./data-table-pagination";
import { cn } from "@/lib/utils";

interface DataTableProps<TData extends { id: string | number }, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  totalCount: number;
  onPaginationChange: (pagination: {
    pageIndex: number;
    pageSize: number;
  }) => void;
  pagination: { pageIndex: number; pageSize: number };
  onSelectionChange?: (rows: TData[]) => void;
}

export function DataTableWithManualPagination<
  TData extends { id: string | number },
  TValue
>({
  columns,
  data,
  actions,
  actionClassNames,
  totalCount,
  onPaginationChange,
  pagination,
  onSelectionChange,
}: DataTableProps<TData, TValue> & {
  searchColumn?: string;
  actions?: React.ReactNode;
  actionClassNames?: string;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  // const [selectedIds, setSelectedIds] = useAtom(atoms.selectedRowIds);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      sorting,
      columnFilters,
      globalFilter,
      pagination,
    },
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === "function" ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    },
    enableRowSelection: true,
  });

  return (
    <div className="w-full overflow-x-auto">
      <div
        className={cn(
          "flex flex-col md:flex-row items-center justify-between  pb-3 gap-3",
          actionClassNames
        )}
      >
        <Input
          placeholder="Search..."
          value={globalFilter ?? ""}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-lg shadow-all-sides-xs outline-none ring-0 focus:ring-0"
        />
        {actions && <>{actions}</>}
      </div>
      <div className="w-full bg-background border shadow-all-sides-xs rounded">
        <Table className="min-w-full">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="bg-gray-50 dark:bg-gray-800"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="pb-2 pt-2">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="py-4">
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
