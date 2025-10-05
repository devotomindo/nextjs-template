import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updatePostSchema = z.object({
  id: z.uuid(),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const updatePost = authProcedure
  .input(updatePostSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [post] = await db
      .update(postsTable)
      .set({
        title: input.title,
        description: input.description || null,
        updatedAt: new Date(),
      })
      .where(eq(postsTable.id, input.id))
      .returning();

    if (!post) {
      throw new ORPCError("NOT_FOUND", { message: "Post not found" });
    }

    return post;
  });
