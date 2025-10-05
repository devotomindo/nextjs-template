import * as schema from "@/db/drizzle/schema";
import { env } from "@/env";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

let connection: Pool;

const globalConnection = global as typeof globalThis & {
  connection: Pool;
};

const dbDefaultConfig = {
  schema,
};

export function createDrizzleConnection(config = dbDefaultConfig) {
  if (!globalConnection.connection) {
    globalConnection.connection = new Pool({
      connectionString: env.DATABASE_URL,
    });
  }

  connection = globalConnection.connection;

  return drizzle({
    client: connection,
    schema: config.schema,
  });
}

// Export the database instance
export const db = createDrizzleConnection();
