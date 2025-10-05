import type { Auth } from "@/lib/auth";
import { os } from "@orpc/server";
import { RequestHeadersPluginContext } from "@orpc/server/plugins";
interface ORPCContext extends RequestHeadersPluginContext {
  user: Auth["$Infer"]["Session"]["user"] | null;
  session: Auth["$Infer"]["Session"]["session"] | null;
}

export const authBase = os.$context<ORPCContext>();
