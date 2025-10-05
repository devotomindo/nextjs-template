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

export const SortableHeader = <T,>({
  column,
  children,
}: {
  column: Column<T, unknown>;
  children: React.ReactNode;
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [filterValue, setFilterValue] = useState(
    (column.getFilterValue() as string) || "",
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSort = () => {
    if (column.getIsSorted() === "asc") {
      column.toggleSorting(true); // desc
    } else if (column.getIsSorted() === "desc") {
      column.clearSorting(); // no sort
    } else {
      column.toggleSorting(false); // asc
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
    if (column.getIsSorted() === "asc")
      return (
        <ArrowUpIcon className="ml-1 size-6 rounded border border-emerald-200 bg-emerald-100 p-1 text-emerald-800" />
      );
    if (column.getIsSorted() === "desc")
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
              onClick={() => column.toggleSorting(false)}
              disabled={column.getIsSorted() === "asc"}
            >
              <ArrowUpIcon className="mr-2 h-4 w-4" />
              Sort Ascending
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => column.toggleSorting(true)}
              disabled={column.getIsSorted() === "desc"}
            >
              <ArrowDownIcon className="mr-2 h-4 w-4" />
              Sort Descending
            </DropdownMenuItem>
            {column.getIsSorted() && (
              <DropdownMenuItem onClick={() => column.clearSorting()}>
                <ArrowUpDownIcon className="mr-2 h-4 w-4" />
                Clear Sort
              </DropdownMenuItem>
            )}
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
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {showFilter && (
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
