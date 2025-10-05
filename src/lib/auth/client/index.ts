import type { Auth } from "@/lib/auth";
import { inferAdditionalFields } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL: env.NEXT_PUBLIC_AUTH_URL, // set this if auth is running on a different url than the client
  plugins: [inferAdditionalFields<Auth>()],
});
