import { getRequestContext } from "@/lib/request-context";
import { router } from "@/lib/orpc/router";
import { RPCHandler } from "@orpc/server/fetch";
import { RequestHeadersPlugin } from "@orpc/server/plugins";

const handler = new RPCHandler(router, {
  plugins: [new RequestHeadersPlugin()],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {
      reqHeaders: request.headers,
      user: null,
      session: null,
    },
  });

  if (!response) {
    return new Response("Not found", { status: 404 });
  }

  const requestId = getRequestContext()?.requestId;
  if (requestId) {
    const cloned = new Response(response.body, response);
    cloned.headers.set("x-request-id", requestId);
    return cloned;
  }

  return response;
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
