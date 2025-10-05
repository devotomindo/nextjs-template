import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";

export const listAllPosts = authProcedure.handler(async ({ context }) => {
  const db = createDrizzleConnection();

  return await db.select().from(postsTable);
});
