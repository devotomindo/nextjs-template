import { createLogger } from "@/lib/logger";
import { runWithRequestContext } from "@/lib/request-context";
import { ORPCError } from "@orpc/server";
import { authBase } from "./auth/auth-base";

const logger = createLogger("orpc");

export const loggingMiddleware = authBase.middleware(async function logRPC({
  path,
  context,
  next,
}) {
  const inboundId = context.reqHeaders?.get("x-request-id");
  const requestId =
    inboundId && inboundId.length <= 128 ? inboundId : crypto.randomUUID();
  const start = performance.now();

  const userId = context.user?.id;

  try {
    const result = await runWithRequestContext({ requestId }, () => next());
    const duration = Math.round(performance.now() - start);

    logger.info({ path, duration, userId }, "rpc.ok");

    return result;
  } catch (error) {
    const duration = Math.round(performance.now() - start);

    logger.error(
      {
        path,
        duration,
        userId,
        code: error instanceof ORPCError ? error.code : undefined,
        err: error,
      },
      "rpc.error",
    );

    throw error;
  }
});
