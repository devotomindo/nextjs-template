import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { ORPCError, os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const deletePostSchema = z.object({
  id: z.uuid(),
});

export const deletePost = os
  .input(deletePostSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [post] = await db
      .delete(postsTable)
      .where(eq(postsTable.id, input.id))
      .returning();

    if (!post) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    return { success: true, deletedPost: post };
  });
