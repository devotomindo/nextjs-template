# User Feature

Authentication UI and server-side auth guard for Better Auth integration.

## Components

| Component | File | Description |
|-----------|------|-------------|
| `LoginForm` | `components/login-form.tsx` | Email/password login with Zod validation, redirects to `/dashboard` on success |

## Guards

| Guard | File | Description |
|-------|------|-------------|
| `authGuard` | `guards/auth-guard.ts` | Server-only session validator with role-based checks, returns `[Session \| null, Error \| null]` tuple |

## Usage

### Protecting oRPC routes

```typescript
import { authGuard } from "@/features/user/guards/auth-guard";

const [session, error] = await authGuard();
if (error) throw error;
// session is now typed and non-null
```

### Role-based access

```typescript
const [session, error] = await authGuard("admin,editor");
// Only allows users with admin or editor role
```
