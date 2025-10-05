import { createDrizzleConnection } from "@/db/drizzle/connection";
import {
  accountTable,
  sessionTable,
  userTable,
  verificationTable,
} from "@/db/drizzle/schema";
import { env } from "@/env";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin } from "better-auth/plugins";
import { v7 as uuidv7 } from "uuid";

const db = createDrizzleConnection();

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: userTable,
      session: sessionTable,
      account: accountTable,
      verification: verificationTable,
    },
  }),
  advanced: {
    database: {
      generateId: () => uuidv7(),
    },
  },
  user: {
    changeEmail: {
      enabled: true,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 300, // 5 minutes
    },
  },
  plugins: [
    admin(),
    nextCookies(), // make sure this is the last plugin in the array
  ],
});

export type Auth = typeof auth;
