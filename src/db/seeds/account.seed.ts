import { createDrizzleConnection } from "@/db/drizzle/connection";
import { userTable } from "@/db/drizzle/schema";
import { auth } from "@/lib/auth";
import { eq, or } from "drizzle-orm";

export const seedAccount = async () => {
  console.log("Seeding account...");

  const db = createDrizzleConnection();

  // delete existing dummy users
  await db
    .delete(userTable)
    .where(
      or(
        eq(userTable.email, "user1@email.com"),
        eq(userTable.email, "admin@email.com"),
      ),
    );

  // create 1 dummy user + 1 admin account
  const user = await auth.api.createUser({
    body: {
      name: "User 1",
      email: "user1@email.com",
      role: "user",
      password: "asdfasdf",
    },
  });

  const admin = await auth.api.createUser({
    body: {
      name: "Admin",
      email: "admin@email.com",
      role: "admin",
      password: "asdfasdf",
    },
  });

  console.log("User created:", user.user.email);
  console.log("Admin created:", admin.user.email);
};
