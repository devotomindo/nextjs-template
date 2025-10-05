import "server-only";

import { userTable } from "@/db/drizzle/schema";
import { auth, type Auth } from "@/lib/auth";
import { headers as nextHeaders } from "next/headers";
import { cache } from "react";

export type UserTable = typeof userTable.$inferSelect;

export type UserAppRoles = UserTable["appRole"];

export const authGuard = cache(async function (props?: {
  allowedRoles?: UserAppRoles;
  headers?: Headers;
}): Promise<[Auth["$Infer"]["Session"] | null, Error | null]> {
  const allowedRoles = props?.allowedRoles ?? [];
  const headers = props?.headers ?? (await nextHeaders());

  const currentUser = await auth.api.getSession({
    headers: headers,
  });

  if (!currentUser) {
    return [null, new Error("[AuthGuard Error] User not found")];
  }

  if (allowedRoles.length > 0) {
    if (!currentUser.user.appRole || currentUser.user.appRole.length === 0) {
      return [
        null,
        new Error("[AuthGuard Error] App role not found in the user's session"),
      ];
    }

    // Note:
    //  - role -> better-auth's admin plugin ["admin", "user"]
    //  - appRole -> our custom app's role (schema.ts -> userTable -> appRole)
    const userAppRoles = currentUser.user.appRole;

    if (userAppRoles) {
      const hasPermission = userAppRoles.some((role) =>
        allowedRoles.includes(role as UserAppRoles[number]),
      );

      if (!hasPermission) {
        return [null, new Error("[AuthGuard Error] User not authorized")];
      }
    }
  }

  return [currentUser, null];
});
