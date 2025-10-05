"use client";

import { SortableHeader } from "@/components/table/sortable-header";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { EditIcon, PlusIcon, SearchIcon, TrashIcon, XIcon } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

type Test = {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  description: string | null;
};

const testFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export function TestsView() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [testToDelete, setTestToDelete] = useState<Test | null>(null);

  const queryClient = useQueryClient();

  const {
    data: tests,
    isLoading,
    error,
  } = useQuery(orpcTanstackQueryUtils.test.listAllTests.queryOptions());

  const createTestMutation = useMutation({
    mutationFn: (data: z.infer<typeof testFormSchema>) =>
      orpcClient.test.createTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.test.listAllTests.queryOptions(),
      );
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
  });

  const updateTestMutation = useMutation({
    mutationFn: (data: { id: string; name: string; description?: string }) =>
      orpcClient.test.updateTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.test.listAllTests.queryOptions(),
      );
      setIsEditDialogOpen(false);
      setSelectedTest(null);
    },
  });

  const deleteTestMutation = useMutation({
    mutationFn: (data: { id: string }) => orpcClient.test.deleteTest(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.test.listAllTests.queryOptions(),
      );
      setIsDeleteDialogOpen(false);
      setTestToDelete(null);
    },
  });

  const createForm = useForm<z.infer<typeof testFormSchema>>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const editForm = useForm<z.infer<typeof testFormSchema>>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const onCreateSubmit = (values: z.infer<typeof testFormSchema>) => {
    createTestMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof testFormSchema>) => {
    if (selectedTest) {
      updateTestMutation.mutate({ ...values, id: selectedTest.id });
    }
  };

  const handleEditClick = useCallback(
    (test: Test) => {
      setSelectedTest(test);
      editForm.reset({
        name: test.name,
        description: test.description || "",
      });
      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  const handleDeleteClick = useCallback((test: Test) => {
    setTestToDelete(test);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = () => {
    if (testToDelete) {
      deleteTestMutation.mutate({ id: testToDelete.id });
    }
  };

  const columns = useMemo<ColumnDef<Test>[]>(
    () => [
      {
        accessorKey: "name",
        header: ({ column }) => (
          <SortableHeader column={column}>Name</SortableHeader>
        ),
      },
      {
        accessorKey: "description",
        header: ({ column }) => (
          <SortableHeader column={column}>Description</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const value = getValue() as string | null;
          return value || <span className="text-gray-400">No description</span>;
        },
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Created At</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return date.toLocaleDateString() + " " + date.toLocaleTimeString();
        },
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Updated At</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return date.toLocaleDateString() + " " + date.toLocaleTimeString();
        },
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          const test = row.original;
          return (
            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(test)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit test</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(test)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete test</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [handleEditClick, handleDeleteClick],
  );

  const tableHook = useReactTable({
    data: tests || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "includesString",
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

   /**
   * do this to prevent React Compiler auto optimize
   * which will cause the table to not re-render after the data is updated
   * ref: https://github.com/TanStack/table/issues/5567
   * ref: https://github.com/TanStack/virtual/issues/743
   */
  const tableRef = useRef(tableHook)
  const table = tableRef.current

  return (
    <div className="container mx-auto space-y-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Tests</h2>
        <div className="flex items-center space-x-2">
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <PlusIcon className="mr-2 h-4 w-4" />
                Add Test
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Test</DialogTitle>
                <DialogDescription>
                  Add a new test to your collection.
                </DialogDescription>
              </DialogHeader>
              <Form {...createForm}>
                <form
                  onSubmit={createForm.handleSubmit(onCreateSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={createForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter test name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Enter test description (optional)"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createTestMutation.isPending}
                    >
                      {createTestMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          {!isLoading && !error && tests && tests.length > 0 && (
            <>
              <div className="relative">
                <SearchIcon className="absolute top-2.5 left-2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search all columns..."
                  value={globalFilter}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-64 pl-8"
                />
              </div>
              {globalFilter && (
                <Button
                  variant="ghost"
                  onClick={() => setGlobalFilter("")}
                  className="h-9 w-9 p-0"
                >
                  <XIcon className="h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">Loading tests...</div>
        </div>
      ) : error ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-red-600">
            Error loading tests: {error.message}
          </div>
        </div>
      ) : !tests || tests.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">No tests found</div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b bg-gray-50">
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-r p-4 text-left last:border-r-0"
                      >
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="border-r p-4 last:border-r-0"
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </td>
                      ))}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="h-24 text-center text-gray-500"
                    >
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing{" "}
                {table.getState().pagination.pageIndex *
                  table.getState().pagination.pageSize +
                  1}{" "}
                to{" "}
                {Math.min(
                  (table.getState().pagination.pageIndex + 1) *
                    table.getState().pagination.pageSize,
                  table.getFilteredRowModel().rows.length,
                )}{" "}
                of {table.getFilteredRowModel().rows.length} test(s)
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm whitespace-nowrap text-gray-600">
                  Rows per page:
                </span>
                <Select
                  value={`${table.getState().pagination.pageSize}`}
                  onValueChange={(value) => {
                    table.setPageSize(Number(value));
                  }}
                >
                  <SelectTrigger className="h-9 w-[70px]">
                    <SelectValue
                      placeholder={table.getState().pagination.pageSize}
                    />
                  </SelectTrigger>
                  <SelectContent side="top">
                    {[5, 10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem key={pageSize} value={`${pageSize}`}>
                        {pageSize}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => table.previousPage()}
                      size="default"
                      className={
                        !table.getCanPreviousPage()
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: table.getPageCount() }, (_, i) => {
                    const pageNumber = i + 1;
                    const currentPage =
                      table.getState().pagination.pageIndex + 1;

                    if (
                      pageNumber === 1 ||
                      pageNumber === table.getPageCount() ||
                      (pageNumber >= currentPage - 1 &&
                        pageNumber <= currentPage + 1)
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationLink
                            onClick={() => table.setPageIndex(i)}
                            isActive={pageNumber === currentPage}
                            size="icon"
                            className="cursor-pointer"
                          >
                            {pageNumber}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    } else if (
                      pageNumber === currentPage - 2 ||
                      pageNumber === currentPage + 2
                    ) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      );
                    }
                    return null;
                  })}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => table.nextPage()}
                      size="default"
                      className={
                        !table.getCanNextPage()
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </>
      )}

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Test</DialogTitle>
            <DialogDescription>Update the test information.</DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit(onEditSubmit)}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter test name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter test description (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTestMutation.isPending}>
                  {updateTestMutation.isPending ? "Updating..." : "Update"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the
              test &quot;{testToDelete?.name}&quot;.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteTestMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteTestMutation.isPending}
            >
              {deleteTestMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
