import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";

export const listAllPosts = os.handler(async () => {
  const db = createDrizzleConnection();

  return await db.select().from(postsTable);
});
