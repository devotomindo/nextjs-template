import { AsyncLocalStorage } from "node:async_hooks";

interface RequestContext {
  readonly requestId: string;
}

const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export function runWithRequestContext<T>(
  ctx: RequestContext,
  fn: () => T,
): T {
  return requestContextStorage.run(ctx, fn);
}
