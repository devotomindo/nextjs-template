import { loggingMiddleware } from "../logging-middleware";
import { authBase } from "./auth-base";
import { authMiddleware } from "./auth-middleware";

export const authProcedure = authBase.use(loggingMiddleware).use(authMiddleware);
