# Next.js Full-Stack Template

A production-ready Next.js 16 full-stack application template with TypeScript, featuring type-safe RPC communication, authentication, database management, and cloud storage.

## Features

- **Type-Safe RPC**: End-to-end type safety with [oRPC](https://orpc.unnoq.com/) for client-server communication
- **Modern UI**: Built with [shadcn/ui](https://ui.shadcn.com/) (New York variant) and [Tailwind CSS](https://tailwindcss.com/)
- **Authentication**: Email/password authentication with [Better Auth](https://www.better-auth.com/) and admin plugin
- **Database**: PostgreSQL with [Drizzle ORM](https://orm.drizzle.team/) and PgBouncer connection pooling
- **Data Management**: [TanStack Query](https://tanstack.com/query) for server state + [TanStack Table](https://tanstack.com/table) for tables
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Storage**: S3-compatible object storage with MinIO
- **Caching**: Redis-backed caching with LRU fallback
- **Performance**: React 19 Compiler enabled in production
- **Developer Experience**: TypeScript, ESLint, Prettier, and type-safe environment variables

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **UI Library**: [React 19](https://react.dev/) with React Compiler
- **RPC Layer**: [oRPC](https://orpc.unnoq.com/)
- **Authentication**: [Better Auth](https://www.better-auth.com/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) + [Drizzle ORM](https://orm.drizzle.team/)
- **Storage**: [MinIO](https://min.io/) (S3-compatible)
- **Caching**: [Redis](https://redis.io/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Package Manager**: [pnpm](https://pnpm.io/)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v20 or higher)
- **pnpm** (v8 or higher)
- **Docker** and **Docker Compose** (for infrastructure services)
- **Git**

## Development Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd nextjs-template
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Environment Variables

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Postgres
POSTGRES_USER=admin
POSTGRES_PASSWORD=superstrongpassword
POSTGRES_DB=myapp
DATABASE_URL="postgresql://admin:superstrongpassword@localhost:6432/myapp"

# MinIO (S3-compatible storage)
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_ENDPOINT=http://localhost:9000

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-here-minimum-32-characters

# Redis (optional in development)
REDIS_URL=redis://localhost:6379
REDIS_ACCESS_KEY=your-redis-password
```

**Note**: Generate a secure `BETTER_AUTH_SECRET` using:

```bash
openssl rand -base64 32
```

### 4. Start Infrastructure Services

Start PostgreSQL, PgBouncer, and MinIO using Docker Compose:

```bash
docker compose up -d
```

This will start:

- **PostgreSQL** on port `5432`
- **PgBouncer** on port `6432` (connection pooler)
- **MinIO** on port `9000` (API) and `9001` (Console)

### 5. Set Up Database

Generate and run database migrations:

```bash
# Generate migration files from schema
pnpm db:generate

# Apply migrations to database
pnpm db:migrate

# Optional: Seed database with sample data
pnpm db:seed
```

### 6. Start Development Server

```bash
pnpm dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

### 7. Access Services

- **Application**: http://localhost:3000
- **MinIO Console**: http://localhost:9001 (login with `MINIO_ROOT_USER` and `MINIO_ROOT_PASSWORD`)
- **Drizzle Studio**: Run `pnpm db:studio` to manage database visually

## Production Setup

### 1. Configure Environment

Create a production `.env` file with secure credentials:

```env
# Use strong passwords and secrets in production!
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=prod_db
DATABASE_URL="postgresql://prod_user:<strong-password>@pgbouncer:6432/prod_db"

MINIO_ROOT_USER=<minio-user>
MINIO_ROOT_PASSWORD=<strong-password>
MINIO_ENDPOINT=http://minio:9000

BETTER_AUTH_SECRET=<generate-with-openssl-rand>

REDIS_URL=redis://redis:6379
REDIS_ACCESS_KEY=<redis-password>

NODE_ENV=production
```

### 2. Configure Reverse Proxy (Optional)

Edit `Caddyfile` for your domain:

```caddyfile
your-domain.com {
    reverse_proxy nextjs:3000
}
```

### 3. Build Docker Image

```bash
docker build -t nextjs:latest .
```

### 4. Start Production Stack

```bash
docker compose -f docker-compose.production.yml up -d
```

This starts:

- PostgreSQL + PgBouncer
- MinIO
- Redis
- Next.js application
- Caddy reverse proxy (port 80/443)

### 5. Run Database Migrations

Execute migrations inside the container:

```bash
docker compose -f docker-compose.production.yml exec nextjs pnpm db:migrate
```

### 6. Access Production Application

- **Application**: http://your-domain.com (or http://localhost if using Caddy locally)
- **Health Check**: Monitor logs with `docker compose -f docker-compose.production.yml logs -f nextjs`

## Using This as a Template

### Option 1: GitHub Template (Recommended)

1. Click **"Use this template"** on GitHub
2. Create your new repository
3. Clone and follow the development setup steps

### Option 2: Manual Setup

1. **Clone and Remove Git History**:

   ```bash
   git clone <this-repo-url> my-new-project
   cd my-new-project
   rm -rf .git
   git init
   ```

2. **Update Project Information**:
   - Edit `package.json`: Change `name`, `version`, `description`
   - Update `README.md` with your project details
   - Modify `CLAUDE.md` if using Claude Code

3. **Clean Example Code**:

   ```bash
   # Remove example feature
   rm -rf src/features/EXAMPLE-post
   ```

4. **Set Up Your First Feature**:

   ```bash
   # Create your feature directory
   mkdir -p src/features/my-feature/{routes,components}
   ```

5. **Initialize Git**:

   ```bash
   git add .
   git commit -m "Initial commit from template"
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

6. **Follow Development Setup** (steps 2-6 from above)

## Project Structure

```
nextjs-template/
├── src/
│   ├── app/                    # Next.js App Router
│   ├── components/             # Shared components
│   │   ├── ui/                # shadcn/ui components
│   │   └── table/             # Table utilities
│   ├── db/
│   │   ├── drizzle/           # Database schema and connection
│   │   └── seeds/             # Database seed files
│   ├── features/              # Feature-based modules
│   │   └── [feature-name]/
│   │       ├── routes/        # oRPC endpoints (backend)
│   │       └── components/    # Feature components
│   ├── lib/
│   │   ├── auth/              # Better Auth configuration
│   │   ├── orpc/              # oRPC client/server setup
│   │   └── utils.ts           # Utility functions
│   └── env.ts                 # Type-safe environment variables
├── migrations/                 # Drizzle database migrations
├── docker-compose.yml          # Development infrastructure
├── docker-compose.production.yml  # Production stack
├── Dockerfile                  # Production container
├── CLAUDE.md                   # Claude Code instructions
└── .env.example               # Environment template
```

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

# Utilities
pnpm with-env <command>     # Run commands with .env loaded
```

## Key Concepts

### Feature-Based Architecture

Organize code by feature in `src/features/[feature-name]/`:

- **`routes/`**: Backend oRPC endpoints
- **`components/`**: Frontend React components

See `src/features/EXAMPLE-post/` for a complete example.

### Type-Safe RPC with oRPC

1. **Define endpoint** in `src/features/[feature]/routes/`:

   ```typescript
   import { os } from "@orpc/server";
   import * as z from "zod";

   export const createPost = os
     .input(z.object({ title: z.string() }))
     .handler(async ({ input }) => {
       // Implementation
     });
   ```

2. **Register in router** (`src/lib/orpc/router.ts`):

   ```typescript
   import { postRouter } from "@/features/EXAMPLE-post/routes";

   export const router = {
     post: postRouter,
     // Add your routes here
   };
   ```

3. **Use in components**:

   ```typescript
   import { orpcClient } from "@/lib/orpc/client";

   const { data } = useQuery({
     queryFn: () => orpcClient.post.listAllPosts(),
   });
   ```

### Authentication

Protected routes with `authGuard`:

```typescript
import { authGuard } from "@/features/user/guards/auth-guard";

export const protectedRoute = os.use(authGuard).handler(async ({ context }) => {
  // context.user and context.session available
});
```

### Database Schema

Define tables in `src/db/drizzle/schema.ts`:

```typescript
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

After changes, run:

```bash
pnpm db:generate  # Generate migration
pnpm db:migrate   # Apply pending migrations to database
```

## Environment Variables

Required variables (see `.env.example`):

| Variable              | Description                  | Example                                    |
| --------------------- | ---------------------------- | ------------------------------------------ |
| `DATABASE_URL`        | PostgreSQL connection string | `postgresql://user:pass@localhost:6432/db` |
| `POSTGRES_USER`       | Database username            | `admin`                                    |
| `POSTGRES_PASSWORD`   | Database password            | `password123`                              |
| `POSTGRES_DB`         | Database name                | `myapp`                                    |
| `MINIO_ROOT_USER`     | MinIO access key             | `minioadmin`                               |
| `MINIO_ROOT_PASSWORD` | MinIO secret key             | `minioadmin123`                            |
| `MINIO_ENDPOINT`      | MinIO API endpoint           | `http://localhost:9000`                    |
| `BETTER_AUTH_SECRET`  | Auth secret (32+ chars)      | Generated with `openssl rand -base64 32`   |
| `REDIS_URL`           | Redis connection URL         | `redis://localhost:6379`                   |
| `REDIS_ACCESS_KEY`    | Redis password               | `redispassword`                            |

**Production**: Set `NODE_ENV=production` for Redis caching and React Compiler optimizations.

## Adding shadcn/ui Components

```bash
npx shadcn@latest add <component-name>
```

Components are installed to `src/components/ui/`.

## Troubleshooting

### Database Connection Issues

- Ensure Docker services are running: `docker compose ps`
- Check PgBouncer is healthy: `docker compose logs pgbouncer`
- Verify `DATABASE_URL` points to PgBouncer (port `6432`)

### MinIO Connection Issues

- Access MinIO console at http://localhost:9001
- Create buckets via console or AWS SDK
- Verify `MINIO_ENDPOINT` matches service location

### Build Errors

- Clear Next.js cache: `rm -rf .next`
- Reinstall dependencies: `pnpm install --force`
- Check TypeScript errors: `pnpm tsc --noEmit`

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m "Add my feature"`
4. Push to branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

**Documentation**: See [CLAUDE.md](CLAUDE.md) for detailed architecture and patterns when using Claude Code.

**Example Feature**: Check `src/features/EXAMPLE-post/` for a complete CRUD implementation example.
