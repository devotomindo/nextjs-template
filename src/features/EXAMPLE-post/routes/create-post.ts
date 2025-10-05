import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const createPost = authProcedure
  .input(createPostSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [post] = await db
      .insert(postsTable)
      .values({
        title: input.title,
        description: input.description || null,
      })
      .returning();

    return post;
  });
