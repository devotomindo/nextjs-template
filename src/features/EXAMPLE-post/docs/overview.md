# EXAMPLE-post Feature

Reference implementation demonstrating the full feature pattern: oRPC routes, TanStack Table with CRUD, React Hook Form + Zod validation.

## oRPC Namespace

`post.*` — registered in `src/lib/orpc/router.ts`.

## Routes

| Route | File | Description |
|-------|------|-------------|
| `post.listAllPosts` | `routes/list-all-posts.ts` | Paginated list with sorting |
| `post.createPost` | `routes/create-post.ts` | Create with Zod validation |
| `post.updatePost` | `routes/update-post.ts` | Update by ID |
| `post.deletePost` | `routes/delete-post.ts` | Delete by ID |

## Components

| Component | File | Description |
|-----------|------|-------------|
| `PostsTable` | `components/posts-table.tsx` | TanStack Table with global filter, pagination, sortable headers, dialog-based CRUD |

## Usage

This feature is a copy-paste starting point for new data management features. Key patterns to follow:

- `useRef` wrapper around `useReactTable` (React Compiler workaround)
- `SortableHeader` from `src/components/table/sortable-header.tsx`
- Dialog-based create/update/delete with React Hook Form
- Query invalidation after mutations
