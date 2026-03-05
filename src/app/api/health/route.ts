import { db } from "@/db/drizzle/connection";
import { createLogger } from "@/lib/logger";
import { getS3Client, StorageBucket } from "@/lib/s3-storage";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { sql } from "drizzle-orm";
import { createClient } from "redis";

const logger = createLogger("health");

type ServiceStatus = "healthy" | "unhealthy";

interface ServiceCheck {
  status: ServiceStatus;
  error?: string;
}

const startTime = Date.now();

const CACHE_TTL_MS = 5_000;
let cachedResult: { body: Record<string, unknown>; status: number } | undefined;
let cachedAt = 0;

async function checkDatabase(): Promise<ServiceCheck> {
  try {
    await db.execute(sql`SELECT 1`);
    return { status: "healthy" };
  } catch (e) {
    return {
      status: "unhealthy",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function checkRedis(): Promise<ServiceCheck> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return { status: "unhealthy", error: "REDIS_URL not configured" };
  }

  let client: ReturnType<typeof createClient> | undefined;
  try {
    client = createClient({
      url: redisUrl,
      password: process.env.REDIS_ACCESS_KEY ?? undefined,
    });
    await client.connect();
    await client.ping();
    return { status: "healthy" };
  } catch (e) {
    return {
      status: "unhealthy",
      error: e instanceof Error ? e.message : String(e),
    };
  } finally {
    try {
      client?.destroy();
    } catch {
      // ignore cleanup errors
    }
  }
}

async function checkMinio(): Promise<ServiceCheck> {
  try {
    const s3Client = getS3Client();
    await s3Client.send(
      new HeadBucketCommand({ Bucket: StorageBucket.PUBLIC }),
    );
    return { status: "healthy" };
  } catch (e) {
    return {
      status: "unhealthy",
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function computeHealth() {
  const [database, redis, minio] = await Promise.all([
    checkDatabase(),
    checkRedis(),
    checkMinio(),
  ]);

  const services = { database, redis, minio };
  const allHealthy = Object.values(services).every(
    (s) => s.status === "healthy",
  );

  const memUsage = process.memoryUsage();

  const body = {
    status: allHealthy ? "healthy" : "degraded",
    uptime: Math.round((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    memory: {
      rss: memUsage.rss,
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
    },
    services,
  };

  if (!allHealthy) {
    logger.warn({ services }, "health.degraded");
  }

  return { body, status: allHealthy ? 200 : 503 };
}

export async function GET() {
  const now = Date.now();

  if (cachedResult && now - cachedAt < CACHE_TTL_MS) {
    return Response.json(cachedResult.body, { status: cachedResult.status });
  }

  const result = await computeHealth();
  cachedResult = result;
  cachedAt = now;

  return Response.json(result.body, { status: result.status });
}
