# Getting Started

First, run the development server:

```bash
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

# Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

# Project Structure

The project structure for our Next.js template is as follows:

```Markdown
├── src                        # Most of project code lives here
│   ├── app                    # App router (https://nextjs.org/docs/app)
│   ├── components             # Global UI components
│   ├── db                     # Database related code
│   │   └── drizzle           # Drizzle ORM setup
│   │       ├── connection.ts  # Database connection
│   │       └── schema.ts     # Database schema
│   ├── features              # Feature-based code organization
│   ├── lib                   # Helper functions and utilities
│   ├── server-api           # Server API setup
│   └── middleware.ts        # Next.js middleware
├── drizzle                   # Drizzle migrations and config
│   ├── migrations
│   └── meta
├── docker_data              # Docker persistent data
├── eslint.config.mjs        # ESLint configuration
├── next.config.ts           # Next.js configuration
├── package.json             # Project dependencies
├── pnpm-lock.yaml          # PNPM lock file
├── postcss.config.mjs      # PostCSS configuration
├── README.md               # This file
├── tailwind.config.ts      # Tailwind configuration
└── tsconfig.json           # TypeScript configuration
```

Here's an explanation of each directory and file:

## `src/`

The `src/` directory contains all the Next.js project source code. Code outside of `src/` typically includes configuration files or code for other projects like a Python backend. Inside `src/` you'll find:

### `app`

This is Next.js's App Router. For details, see the docs at https://nextjs.org/docs/app. The root layout under the app folder is configured to accommodate packages like Tanstack Query and Mantine.

### `components`

While we use Mantine for most UI components, projects often need custom UI components. This is where global custom UI components are placed. As a general rule, try to place feature-specific UI components in the `features` directory since they're often coupled with specific functionality. Only place components here if they're used across multiple features.

### `db`

This directory contains all database-related code. Currently, it includes:

#### `drizzle`

[Drizzle ORM](https://orm.drizzle.team/docs/overview) is our Object-Relational Mapping (ORM) package that provides type-safety for SQL queries. It's chosen for its excellent TypeScript support and SQL-like syntax.

The drizzle directory contains:

- `connection.ts`: Database connection facade
- `schema.ts`: Main schema definition file

### `features`

Features use a colocation pattern for organizing code by functionality. This approach is preferred because developers spend most of their time reading and refactoring code. Colocating related code makes refactoring faster and more intuitive.

Each feature typically contains:

- `actions/`: Server actions for CRUD operations
- `components/`: Feature-specific components (forms, tables, views, etc.)
- `utils/`: Feature-specific utility functions

### `lib`

Contains helper functions like custom hooks, database utilities, image compression, etc.

### `server-api`

Contains the server API setup using the `createServerApi` utility for creating type-safe API endpoints.

# Common Patterns

## 1. Server Actions with Zod Validation

Server actions are used for CRUD operations with form data validation using Zod. Here's an example:

```tsx
"use server";

import { z } from "zod";
import { zfd } from "zod-form-data";

export async function createPost(prevState: any, formData: FormData) {
  // VALIDATION
  const validationRules = z.object({
    title: zfd.text(z.string().min(1).max(100)),
    content: zfd.text(z.string().min(1).max(1000)),
    isProtected: zfd.checkbox(),
    image: zfd.file().optional(),
  });

  const validationResult = await zfd
    .formData(validationRules)
    .safeParseAsync(formData);

  if (!validationResult.success) {
    const errorFlattened = validationResult.error.format();
    return {
      error: {
        title: errorFlattened.title?._errors,
        content: errorFlattened.content?._errors,
        isProtected: errorFlattened.isProtected?._errors,
        image: errorFlattened.image?._errors,
      },
    };
  }

  // Process validated data...
}
```

## 2. Server API with Tanstack Query

For data fetching, we use a combination of Server API and Tanstack Query for optimal performance:

```tsx
// Server API definition
export const getPostList = createServerApi<
  GetPostListParams,
  GetPostListResponse
>({
  function: getPostListFunction,
  path: "/post/get-post-list",
  inputSchema: getPostListParamsSchema,
});

// Client-side usage
function PostList() {
  const queryClient = useQueryClient();

  const posts = useQuery({
    queryKey: ["posts"],
    queryFn: () => getPostList({ page: 1, pageSize: 10 }),
  });

  return (
    <div>
      {posts.data?.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  );
}
```

> **Important**: After creating a new server API, make sure to import it in `src/server-api/load-server-api.ts`. This ensures the API is properly registered and available for use. For example:
>
> ```tsx
> // src/server-api/load-server-api.ts
> import "@/features/your-feature/actions/your-api";
> ```

## 3. Database Schema with Drizzle

We use Drizzle ORM for type-safe database operations:

```tsx
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  title: text("title").notNull(),
  content: text("content").notNull(),
  image: text("image"),
  isProtected: boolean("is_protected").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
});
```

## 4. Environment Variables

We use `@t3-oss/env-nextjs` for type-safe environment variables:

```tsx
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    BETTER_AUTH_SECRET: z.string(),
  },
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
  },
});
```

# Development Setup

1. Copy `.env.example` to `.env` and fill in the required values
2. Start the development environment:
   ```bash
   docker-compose -f docker-compose.development.yml up -d
   ```
3. Run database migrations:
   ```bash
   pnpm db:push
   ```
4. Start the development server:
   ```bash
   pnpm dev
   ```

# Available Scripts

- `pnpm dev`: Start development server
- `pnpm build`: Build for production
- `pnpm start`: Start production server
- `pnpm db:generate`: Generate database migrations
- `pnpm db:push`: Push database changes
- `pnpm db:studio`: Open Drizzle Studio
- `pnpm lint`: Run ESLint
- `pnpm format:write`: Format code with Prettier
