import testRouter from "@/features/test/routes";

export const router = {
  test: testRouter,
};

export type Router = typeof router;
