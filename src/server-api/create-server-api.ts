import { NextRequest, NextResponse } from "next/server";
import { cache } from "react";
import { z } from "zod";
import { apiRegistry } from "./api-registry";

interface CreateServerApiOptions<TInput, TOutput> {
  /**
   * The function to wrap
   */
  function: (input: TInput) => Promise<TOutput>;
  /**
   * The path for the API endpoint
   * @example "/users/get-by-id"
   */
  path: string;
  /**
   * Input validation schema
   */
  inputSchema?: z.ZodType<TInput>;
}

/**
 * Creates a server API endpoint from a server function and automatically registers it
 *
 * @param function - The server function to wrap
 * @param path - The path for the API endpoint. make sure it's unique
 * @param inputSchema - The input validation schema using zod
 *
 * @example
 * ```ts
 * // src/features/user/actions/get-user-by-id/index.ts
 * import { createServerApi } from "@/lib/server-api/create-server-api";
 * import { z } from "zod";
 *
 * export const getUserById = createServerApi<GetUserByIdParams, GetUserByIdResponse>({
 *   function: async (params) => {
 *     // ... implementation
 *   },
 *   path: "/users/get-by-id",
 *   inputSchema: z.object({
 *     id: z.string(),
 *   }),
 * });
 * ```
 */
export function createServerApi<TInput, TOutput>({
  function: fn,
  path,
  inputSchema,
}: CreateServerApiOptions<TInput, TOutput>) {
  // Create the API handler
  const handler = async (req: NextRequest) => {
    try {
      // Only allow POST method for all endpoints
      if (req.method !== "POST") {
        return NextResponse.json(
          { error: "Only POST method is allowed" },
          { status: 405 },
        );
      }

      let input: any;

      try {
        // Parse JSON body
        const body = await req.json();
        input = body;
      } catch {
        return NextResponse.json(
          { error: "Invalid JSON body" },
          { status: 400 },
        );
      }

      // Validate input if schema is provided
      if (inputSchema) {
        const result = inputSchema.safeParse(input);
        if (!result.success) {
          return NextResponse.json(
            { error: "Invalid input", details: result.error.format() },
            { status: 400 },
          );
        }
        input = result.data;
      }

      // Execute the server function
      const output = await fn(input as TInput);

      return NextResponse.json(output);
    } catch (error: any) {
      console.error("API Error:", error);
      return NextResponse.json(
        { error: error?.message || "Internal server error" },
        { status: 500 },
      );
    }
  };

  // Register the handler
  apiRegistry.register(path, handler);

  // return API function. It will call the server function if it's on the server,
  // in client it will call the fetch-based implementation
  return cache(async (input: TInput = {} as TInput) => {
    return (
      typeof window === "undefined"
        ? fn(input)
        : await fetch(`/api/server${path}`, {
            method: "POST",
            body: JSON.stringify(input),
          }).then((res) => res.json())
    ) as TOutput;
  });
}
