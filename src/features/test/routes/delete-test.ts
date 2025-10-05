import { createDrizzleConnection } from "@/db/drizzle/connection";
import { testsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";
import { eq } from "drizzle-orm";
import { z } from "zod";

const deleteTestSchema = z.object({
  id: z.uuid(),
});

export const deleteTest = os
  .input(deleteTestSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();

    const [test] = await db
      .delete(testsTable)
      .where(eq(testsTable.id, input.id))
      .returning();

    if (!test) {
      throw new Error("Test not found");
    }

    return { success: true, deletedTest: test };
  });
