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
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import type { Router } from "@/lib/orpc/router";
import { fuzzyFilter } from "@/lib/table/fuzzy-filter";
import { zodResolver } from "@hookform/resolvers/zod";
import type { InferRouterOutputs } from "@orpc/server";
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
import * as z from "zod";

type Post = InferRouterOutputs<Router>["post"]["listAllPosts"][number];

const postFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export function PostsTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [postToDelete, setPostToDelete] = useState<Post | null>(null);

  const queryClient = useQueryClient();

  const {
    data: posts,
    isLoading,
    error,
  } = useQuery(orpcTanstackQueryUtils.post.listAllPosts.queryOptions());

  const createPostMutation = useMutation({
    mutationFn: (data: z.infer<typeof postFormSchema>) =>
      orpcClient.post.createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description?: string }) =>
      orpcClient.post.updatePost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsEditDialogOpen(false);
      setSelectedPost(null);
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (data: { id: string }) => orpcClient.post.deletePost(data),
    onSuccess: () => {
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    },
  });

  const createForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const editForm = useForm<z.infer<typeof postFormSchema>>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      title: "",
      description: "",
    },
  });

  const onCreateSubmit = (values: z.infer<typeof postFormSchema>) => {
    createPostMutation.mutate(values);
  };

  const onEditSubmit = (values: z.infer<typeof postFormSchema>) => {
    if (selectedPost) {
      updatePostMutation.mutate({ ...values, id: selectedPost.id });
    }
  };

  const handleEditClick = useCallback(
    (post: Post) => {
      setSelectedPost(post);
      editForm.reset({
        title: post.title,
        description: post.description || "",
      });
      setIsEditDialogOpen(true);
    },
    [editForm],
  );

  const handleDeleteClick = useCallback((post: Post) => {
    setPostToDelete(post);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = () => {
    if (postToDelete) {
      deletePostMutation.mutate({ id: postToDelete.id });
    }
  };

  const columns = useMemo<ColumnDef<Post>[]>(
    () => [
      {
        accessorKey: "title",
        header: ({ column }) => (
          <SortableHeader column={column}>Title</SortableHeader>
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
          const post = row.original;
          return (
            <div className="flex space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditClick(post)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit post</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClick(post)}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete post</TooltipContent>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [handleEditClick, handleDeleteClick],
  );

  const tableHook = useReactTable({
    data: posts || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: "fuzzy",
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
  const tableRef = useRef(tableHook);
  const table = tableRef.current;

  return (
    <div className="space-y-4 px-4 py-8">
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
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
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
                      disabled={createPostMutation.isPending}
                    >
                      {createPostMutation.isPending ? "Creating..." : "Create"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          {!isLoading && !error && posts && posts.length > 0 && (
            <InputGroup className="w-64">
              <InputGroupAddon align="inline-start">
                <SearchIcon />
              </InputGroupAddon>
              <InputGroupInput
                placeholder="Search"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
              {globalFilter && (
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    size="icon-xs"
                    onClick={() => setGlobalFilter("")}
                  >
                    <XIcon />
                  </InputGroupButton>
                </InputGroupAddon>
              )}
            </InputGroup>
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
      ) : !posts || posts.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-lg text-gray-600">No tests found</div>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <table className="w-full">
              <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id}>
                    {headerGroup.headers.map((header) => (
                      <th
                        key={header.id}
                        className="border-r border-slate-100 px-4 py-3 last:border-r-0"
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
              <tbody className="divide-y divide-slate-100 bg-white">
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-100 transition last:border-b-0 hover:bg-slate-50/70"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="border-r border-slate-100 px-4 py-4 last:border-r-0"
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
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
                <Button type="submit" disabled={updatePostMutation.isPending}>
                  {updatePostMutation.isPending ? "Updating..." : "Update"}
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
              test{" "}
              <span className="font-bold">
                &quot;{postToDelete?.title}&quot;
              </span>
              .
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletePostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deletePostMutation.isPending}
            >
              {deletePostMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
