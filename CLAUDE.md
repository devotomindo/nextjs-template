# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Quality Standards

- Make minimal, surgical changes
- **Never compromise type safety**: No `any`, no non-null assertion operator (`!`), no type assertions (`as Type`)
- **Make illegal states unrepresentable**: Model domain with ADTs/discriminated unions; parse inputs at boundaries into typed structures; if state can't exist, code can't mishandle it
- **Abstractions**: Consciously constrained, pragmatically parameterised, doggedly documented

### **ENTROPY REMINDER**

This codebase will outlive you. Every shortcut you take becomes
someone else's burden. Every hack compounds into technical debt
that slows the whole team down.

You are not just writing code. You are shaping the future of this
project. The patterns you establish will be copied. The corners
you cut will be cut again.

**Fight entropy. Leave the codebase better than you found it.**

## Plans

- At the end of each plan, give me a list of unresolved questions to answer, if any. Make the questions extremely concise. Sacrifice grammar for the sake of concision.

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

# Quality
pnpm check                  # Typecheck + lint
pnpm typecheck              # tsc --noEmit
pnpm lint                   # Run oxlint + ESLint
pnpm format                 # Format with Prettier
pnpm format:check           # Check formatting

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

Features are organized in `src/features/[feature-name]/` with `routes/` (oRPC endpoints) and `components/` (React components). New features follow `src/features/EXAMPLE-post/` as the reference pattern, registered in `src/lib/orpc/router.ts`.

### oRPC (Type-Safe RPC)

Define routes in `src/features/[feature]/routes/` using `os.input(schema).handler(fn)`.
Register in `src/lib/orpc/router.ts`.
Client: `orpcClient.post.createPost(data)` / `orpcTanstackQueryUtils.post.listAllPosts.queryOptions()`
See `src/features/EXAMPLE-post/` for full pattern.

### Data Tables (TanStack Table)

Use `useReactTable` with `useRef` wrapper (React Compiler workaround).
See `src/features/EXAMPLE-post/components/posts-table.tsx`.

### Form Handling

React Hook Form + Zod + shadcn/ui Form components.
See `src/features/EXAMPLE-post/` for pattern.

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

## Feature Documentation

Features may include a `docs/` subfolder with `.md` files for developer-facing documentation. `overview.md` covers the domain map, routes, types, and components; additional `.md` files document complex subsystems. Add docs when a feature exceeds ~15 files, has complex type systems, or involves multiple interacting domains.

## Notes

- All files use kebab-case naming (e.g., `posts-table.tsx`, `create-post.ts`)
- React Compiler enabled globally
- Standalone output mode configured for Docker deployment
- Uses pnpm as package manager
- Prettier configured with import organization and Tailwind sorting
