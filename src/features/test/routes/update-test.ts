import { createDrizzleConnection } from "@/db/drizzle/connection";
import { testsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const updateTestSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
});

export const updateTest = os
  .input(updateTestSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [test] = await db
      .update(testsTable)
      .set({
        name: input.name,
        description: input.description || null,
        updatedAt: new Date(),
      })
      .where(eq(testsTable.id, input.id))
      .returning();

    if (!test) {
      throw new Error("Test not found");
    }

    return test;
  });
