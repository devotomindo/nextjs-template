import { createDrizzleConnection } from "@/db/drizzle/connection";
import { postsTable } from "@/db/drizzle/schema";
import { authProcedure } from "@/lib/orpc/auth/auth-procedure";
import { asc, count, desc, ilike, or, SQL } from "drizzle-orm";
import * as z from "zod";

const sortByEnum = z.enum(["title", "createdAt", "updatedAt"]);
const sortOrderEnum = z.enum(["asc", "desc"]);

const inputSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(10),
  search: z.string().optional(),
  sortBy: sortByEnum.default("createdAt"),
  sortOrder: sortOrderEnum.default("desc"),
});

export const listAllPosts = authProcedure
  .input(inputSchema)
  .handler(async ({ input }) => {
    const db = createDrizzleConnection();
    const { page, pageSize, search, sortBy, sortOrder } = input;

    // Build search condition
    let searchCondition: SQL | undefined;
    if (search && search.trim()) {
      const searchPattern = `%${search.trim()}%`;
      searchCondition = or(
        ilike(postsTable.title, searchPattern),
        ilike(postsTable.description, searchPattern),
      );
    }

    // Get total count with filters
    const [countResult] = await db
      .select({ count: count() })
      .from(postsTable)
      .where(searchCondition);

    const totalCount = countResult?.count ?? 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Build sort column
    const sortColumn = {
      title: postsTable.title,
      createdAt: postsTable.createdAt,
      updatedAt: postsTable.updatedAt,
    }[sortBy];

    const orderBy = sortOrder === "asc" ? asc(sortColumn) : desc(sortColumn);

    // Get paginated results
    const offset = (page - 1) * pageSize;
    const posts = await db
      .select()
      .from(postsTable)
      .where(searchCondition)
      .orderBy(orderBy)
      .limit(pageSize)
      .offset(offset);

    return {
      posts,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages,
      },
    };
  });
