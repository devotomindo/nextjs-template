import pino from "pino";

import { getRequestContext } from "@/lib/request-context";

const isDev = process.env.NODE_ENV === "development";

const baseLogger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  mixin() {
    const ctx = getRequestContext();
    return ctx ? { requestId: ctx.requestId } : {};
  },
  ...(isDev
    ? { transport: { target: "pino-pretty", options: { colorize: true } } }
    : {}),
});

export function createLogger(module: string) {
  return baseLogger.child({ module });
}
