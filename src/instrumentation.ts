export async function register() {
  // initialize orpc client
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./lib/orpc/client.server");
  }

  // initialize cache handler
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NODE_ENV === "production"
  ) {
    const { registerInitialCache } = await import(
      "@fortedigital/nextjs-cache-handler/instrumentation"
    );
    const CacheHandler = (await import("../cache-handler.mjs")).default;
    await registerInitialCache(CacheHandler);
  }
}
