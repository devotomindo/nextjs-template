import { authGuard } from "@/features/user/guards/auth-guard";
import { ORPCError } from "@orpc/server";
import { authBase } from "./auth-base";

export const authMiddleware = authBase.middleware(async ({ context, next }) => {
  if (!context.reqHeaders) {
    throw new ORPCError("NOT_FOUND", { message: "Missing headers" });
  }

  const [session, error] = await authGuard({
    headers: context.reqHeaders,
  });

  if (!session || error) {
    context.user = null;
    context.session = null;
    return next();
  }

  context.user = session.user;
  context.session = session.session;
  return next();
});
