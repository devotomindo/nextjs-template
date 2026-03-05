import { seedAccount } from "./account.seed";
import { seedPosts } from "./posts.seed";
import { seedStorage } from "./storage.seed";

async function runAllSeeds() {
  console.log("🌱 Starting database seeding...");

  try {
    await seedStorage();
    await seedAccount();
    await seedPosts();

    console.log("🎉 All seeds completed successfully!");
  } catch (error) {
    console.error("💥 Seeding failed:", error);
    process.exit(1);
  }
}

// Run all seeds if this file is executed directly
if (require.main === module) {
  runAllSeeds()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
