import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";
import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
});

export const createPost = os
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
