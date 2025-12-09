# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Next.js 16 full-stack application template with TypeScript, featuring type-safe RPC communication via oRPC, authentication with Better Auth, database management with Drizzle ORM and PostgreSQL, S3-compatible storage (MinIO), and Redis caching.

**UI Library**: shadcn/ui (New York variant) - installed components are in `src/components/ui/`

**Key Technologies**:
- Next.js 16 with React 19 and React Compiler
- oRPC for type-safe client-server communication
- TanStack Query + TanStack Table for data management and tables
- React Hook Form with Zod validation
- Better Auth for authentication
- Drizzle ORM with PostgreSQL
- Redis caching with custom cache handler
- S3-compatible storage (MinIO)

## Development Commands

```bash
# Development
pnpm dev                    # Start dev server (http://localhost:3000)
pnpm build                  # Build for production
pnpm start                  # Start production server
pnpm lint                   # Run ESLint

# Database
pnpm db:generate            # Generate migrations from schema
pnpm db:migrate             # Run pending migrations
pnpm db:push                # Push schema changes directly (prefer db:migrate over db:push)
pnpm db:studio              # Open Drizzle Studio
pnpm db:seed                # Seed database with sample data

# Environment
pnpm with-env <command>     # Run commands with .env loaded
```

## Architecture & Patterns

### Feature-Based Structure

Features are organized in `src/features/[feature-name]/` with:
- `routes/` - oRPC endpoints (backend logic)
- `components/` - React components

Example: `src/features/EXAMPLE-post/` demonstrates the pattern.

### oRPC Setup (Type-Safe RPC)

1. **Define routes** in `src/features/[feature]/routes/`:
   ```typescript
   import { os } from "@orpc/server";
   import * as z from "zod";

   export const createPost = os
     .input(z.object({ title: z.string() }))
     .handler(async ({ input }) => {
       // Implementation
     });
   ```

2. **Register in router** at `src/lib/orpc/router.ts`:
   ```typescript
   export const router = {
     post: postRouter,
     // Add new feature routers here
   };
   ```

3. **Client usage** (see `src/features/EXAMPLE-post/components/posts-view.tsx`):
   ```typescript
   import { orpcClient, orpcTanstackQueryUtils } from "@/lib/orpc/client";

   // TanStack Query
   const { data } = useQuery(
     orpcTanstackQueryUtils.post.listAllPosts.queryOptions()
   );

   // Mutations
   const mutation = useMutation({
     mutationFn: (data) => orpcClient.post.createPost(data),
     onSuccess: () => {
       queryClient.invalidateQueries(
         orpcTanstackQueryUtils.post.listAllPosts.queryOptions()
       );
     },
   });
   ```

### Data Tables with TanStack Table

Follow the pattern in `src/features/EXAMPLE-post/components/posts-view.tsx`:
- Use `useReactTable` with column definitions
- Implement sorting with `<SortableHeader>` from `src/components/table/sortable-header.tsx`
- Include global filtering, pagination, and CRUD operations via dialogs
- **Important**: Use `useRef` to prevent React Compiler auto-optimization issues:
  ```typescript
  const tableHook = useReactTable({ /* config */ });
  const tableRef = useRef(tableHook);
  const table = tableRef.current; // Use this in JSX
  ```

### Form Handling

Combine React Hook Form + Zod + shadcn/ui Form components:
```typescript
const schema = z.object({ title: z.string().min(1) });
const form = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
  defaultValues: { title: "" },
});
```

### Authentication

- **Better Auth** configured in `src/lib/auth/index.ts`
- Email/password authentication enabled
- Admin plugin included
- Session cookie caching (5 minutes)
- Use `authGuard` from `src/features/user/guards/auth-guard.ts` in oRPC middleware
- UUIDs use `uuid v7` for time-sortable IDs

### Database

- **Schema**: `src/db/drizzle/schema.ts` (uses snake_case via Drizzle config)
- **Connection**: `src/db/drizzle/connection.ts`
- **Seeds**: `src/db/seeds/` - add new seed files and register in `index.ts`
- Migrations stored in `/migrations`

### Environment Variables

Managed via `@t3-oss/env-nextjs` in `src/env.ts`:
- Type-safe with Zod validation
- Server/client/shared vars separated
- Add new variables to both schema and `runtimeEnv` object

Required env vars (from `src/env.ts`):
```
DATABASE_URL
MINIO_ROOT_USER
MINIO_ROOT_PASSWORD
MINIO_ENDPOINT
BETTER_AUTH_SECRET
NODE_ENV
```

### Caching

- **Production**: Redis + LRU composite handler (`cache-handler.mjs`)
- **Development**: LRU only
- Tag with `memory-cache` for LRU-only caching
- Requires `REDIS_URL` env var in production

### Import Aliases

- `@/*` maps to `src/*`
- shadcn/ui components: `@/components/ui/*`
- Utils: `@/lib/utils`

## Adding New Features

1. Create feature directory: `src/features/[feature-name]/`
2. Add routes in `routes/` subfolder
3. Export router from `routes/index.ts`
4. Register in `src/lib/orpc/router.ts`
5. Create components in `components/` subfolder
6. Add database tables to `src/db/drizzle/schema.ts` if needed
7. Run `pnpm db:generate` and `pnpm db:migrate` for schema changes

## File Naming

- Components: PascalCase (e.g., `PostsView.tsx` → use `posts-view.tsx`)
- Routes: kebab-case (e.g., `create-post.ts`)
- Utilities: kebab-case (e.g., `media-converter.ts`)

## Notes

- React Compiler enabled in production
- Standalone output mode configured for Docker deployment
- Uses pnpm as package manager
- Prettier configured with import organization and Tailwind sorting
