"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ArrowDownIcon,
  ArrowUpDownIcon,
  ArrowUpIcon,
  MoreVerticalIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import { useRef, useState } from "react";

import type { Column } from "@tanstack/react-table";

type SortDirection = "asc" | "desc" | false;

interface SortableHeaderProps<T> {
  column: Column<T, unknown>;
  children: React.ReactNode;
  /** Override sort direction for server-side sorting */
  sortDirection?: SortDirection;
  /** Callback for server-side sorting */
  onSort?: (direction: SortDirection) => void;
}

export const SortableHeader = <T,>({
  column,
  children,
  sortDirection,
  onSort,
}: SortableHeaderProps<T>) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState(
    (column.getFilterValue() as string) || "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  // Use server-side sort direction if provided, otherwise fall back to TanStack Table
  const isServerSide = sortDirection !== undefined && onSort !== undefined;
  const currentSortDirection = isServerSide
    ? sortDirection
    : column.getIsSorted();

  const handleSort = () => {
    if (isServerSide) {
      // Server-side sorting: cycle through asc -> desc -> false
      if (currentSortDirection === "asc") {
        onSort("desc");
      } else if (currentSortDirection === "desc") {
        onSort(false);
      } else {
        onSort("asc");
      }
    } else {
      // Client-side sorting using TanStack Table
      if (column.getIsSorted() === "asc") {
        column.toggleSorting(true); // desc
      } else if (column.getIsSorted() === "desc") {
        column.clearSorting(); // no sort
      } else {
        column.toggleSorting(false); // asc
      }
    }
  };

  const handleSortAsc = () => {
    if (isServerSide) {
      onSort("asc");
    } else {
      column.toggleSorting(false);
    }
  };

  const handleSortDesc = () => {
    if (isServerSide) {
      onSort("desc");
    } else {
      column.toggleSorting(true);
    }
  };

  const handleClearSort = () => {
    if (isServerSide) {
      onSort(false);
    } else {
      column.clearSorting();
    }
  };

  const handleFilter = (value: string) => {
    setFilterValue(value);
    column.setFilterValue(value);
  };

  const clearFilter = () => {
    setFilterValue("");
    column.setFilterValue("");
    setShowFilter(false);
  };

  const getSortIcon = () => {
    if (currentSortDirection === "asc")
      return (
        <ArrowUpIcon className="ml-1 size-6 rounded border border-emerald-200 bg-emerald-100 p-1 text-emerald-800" />
      );
    if (currentSortDirection === "desc")
      return (
        <ArrowDownIcon className="ml-1 size-6 rounded border border-emerald-200 bg-emerald-100 p-1 text-emerald-800" />
      );
    return <ArrowUpDownIcon className="ml-1 h-4 w-4" />;
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={handleSort}
          className="h-auto p-0 font-semibold hover:bg-transparent"
        >
          {children}
          {getSortIcon()}
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreVerticalIcon className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={handleSortAsc}
              disabled={currentSortDirection === "asc"}
            >
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleSortDesc}
              disabled={currentSortDirection === "desc"}
            >
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Sort Descending
            </DropdownMenuItem>
            {currentSortDirection && (
              <DropdownMenuItem onClick={handleClearSort}>
                <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                Clear Sort
              </DropdownMenuItem>
            )}
            {!isServerSide && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => {
                    if (showFilter) {
                      clearFilter();
                    } else {
                      setShowFilter(true);
                      setTimeout(() => {
                        inputRef.current?.focus();
                      }, 200);
                    }
                  }}
                >
                  <SearchIcon className="mr-2 h-4 w-4" />
                  {showFilter ? "Hide Filter" : "Show Filter"}
                </DropdownMenuItem>
                {filterValue && (
                  <DropdownMenuItem onClick={clearFilter}>
                    <XIcon className="mr-2 h-4 w-4" />
                    Clear Filter
                  </DropdownMenuItem>
                )}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showFilter && !isServerSide && (
        <Input
          ref={inputRef}
          placeholder={`Filter ${children}`}
          value={filterValue}
          onChange={(e) => handleFilter(e.target.value)}
          className="h-8"
        />
      )}
    </div>
  );
};
