import { createDrizzleConnection } from "@/db/drizzle/connection";
import { testsTable } from "@/db/drizzle/schema";
import { os } from "@orpc/server";

export const listAllTests = os.handler(async () => {
  const db = createDrizzleConnection();

  const tests = await db.select().from(testsTable);

  return tests;
});
