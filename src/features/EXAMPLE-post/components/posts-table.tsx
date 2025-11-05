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
import {
  AlertTriangle,
  EditIcon,
  FileText,
  Loader2,
  PlusIcon,
  SearchIcon,
  TrashIcon,
} from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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
      toast.success("Post created successfully");
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to create post",
      );
    },
  });

  const updatePostMutation = useMutation({
    mutationFn: (data: { id: string; title: string; description?: string }) =>
      orpcClient.post.updatePost(data),
    onSuccess: () => {
      toast.success("Post updated successfully");
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsEditDialogOpen(false);
      setSelectedPost(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to update post",
      );
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: (data: { id: string }) => orpcClient.post.deletePost(data),
    onSuccess: () => {
      toast.success("Post deleted successfully");
      queryClient.invalidateQueries(
        orpcTanstackQueryUtils.post.listAllPosts.queryOptions(),
      );
      setIsDeleteDialogOpen(false);
      setPostToDelete(null);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete post",
      );
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
        cell: ({ row }) => (
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">
                {row.original.title}
              </p>
              {row.original.description && (
                <p className="mt-1 line-clamp-1 text-xs text-slate-500">
                  {row.original.description}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Created</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return (
            <span className="text-sm text-slate-600">
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
        sortingFn: "datetime",
      },
      {
        accessorKey: "updatedAt",
        header: ({ column }) => (
          <SortableHeader column={column}>Updated</SortableHeader>
        ),
        cell: ({ getValue }) => {
          const date = getValue() as Date;
          return (
            <span className="text-sm text-slate-600">
              {date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          );
        },
        sortingFn: "datetime",
      },
      {
        id: "actions",
        header: () => <div className="text-right">Actions</div>,
        cell: ({ row }) => {
          const post = row.original;
          return (
            <div className="flex justify-end space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
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
                    size="icon"
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
    <div className="flex flex-col gap-4 p-4">
      <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl lg:text-3xl">
            Posts
          </h1>
          <p className="mt-1 text-sm text-gray-600 sm:mt-2">
            Manage your blog posts and content.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <Button
            size="default"
            onClick={() => setIsCreateDialogOpen(true)}
            className="w-full sm:w-auto"
          >
            <PlusIcon className="mr-2 h-4 w-4" /> New Post
          </Button>
        </div>
      </header>

      <section className="rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div />
          <div className="relative w-full sm:max-w-md sm:flex-1 lg:max-w-lg">
            <SearchIcon className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search posts..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="w-full pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-y border-slate-100 bg-slate-50 text-left text-xs tracking-wide text-slate-500 uppercase">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th key={header.id} className="px-4 py-3 sm:px-6">
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
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                      Loading posts...
                    </div>
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center text-sm text-red-600 sm:px-6 sm:py-20"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <AlertTriangle className="h-6 w-6" />
                      Error loading posts: {error.message}
                    </div>
                  </td>
                </tr>
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-16 text-center text-sm text-slate-500 sm:px-6 sm:py-20"
                  >
                    {globalFilter
                      ? "No posts match your search. Try adjusting your search terms."
                      : "No posts yet. Create your first post to get started."}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="transition hover:bg-slate-50/70">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-4 sm:px-6">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-6">
          <div className="text-center text-sm text-gray-600 lg:text-left">
            Showing{" "}
            {table.getState().pagination.pageIndex *
              table.getState().pagination.pageSize +
              1}{" "}
            -{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) *
                table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length,
            )}{" "}
            of {table.getFilteredRowModel().rows.length} post
            {table.getFilteredRowModel().rows.length !== 1 ? "s" : ""}
          </div>

          <div className="flex flex-col items-center gap-3 lg:flex-row lg:gap-2">
            <div className="flex items-center gap-2">
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
              <PaginationContent className="flex-wrap">
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
                  const currentPage = table.getState().pagination.pageIndex + 1;

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
      </section>

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              Create New Post
            </DialogTitle>
            <DialogDescription>
              Add a new post to your collection.
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
                      <Input placeholder="Enter post title" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter post description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createPostMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createPostMutation.isPending}
                  className="min-w-[100px]"
                >
                  {createPostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusIcon className="mr-2 h-4 w-4" />
                      Create
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Edit Post</DialogTitle>
            <DialogDescription>Update the post information.</DialogDescription>
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
                      <Input placeholder="Enter post title" {...field} />
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
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter post description"
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                  disabled={updatePostMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updatePostMutation.isPending}
                  className="min-w-[100px]"
                >
                  {updatePostMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <EditIcon className="mr-2 h-4 w-4" />
                      Update
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader className="space-y-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1 space-y-1">
                <DialogTitle className="text-xl">Delete Post?</DialogTitle>
                <DialogDescription className="text-sm">
                  This action cannot be undone. The post will be permanently
                  deleted.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4">
              <div className="space-y-2">
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                  Post to be deleted
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {postToDelete?.title || "-"}
                </p>
                {postToDelete?.description && (
                  <p className="text-sm text-slate-600">
                    {postToDelete.description}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-red-200 bg-red-50 p-3.5">
              <div className="flex gap-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
                <p className="text-sm text-red-900">
                  This will permanently delete the post and all associated data.
                  This action cannot be undone.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deletePostMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deletePostMutation.isPending}
              className="min-w-[100px]"
            >
              {deletePostMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <TrashIcon className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
