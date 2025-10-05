import { createDrizzleConnection } from "@/db/drizzle/connection";
import { testsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";
import { z } from "zod";

const createTestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const createTest = os
  .input(createTestSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [test] = await db
      .insert(testsTable)
      .values({
        name: input.name,
        description: input.description || null,
      })
      .returning();

    return test;
  });
