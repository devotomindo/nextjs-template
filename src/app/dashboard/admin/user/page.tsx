import { DashboardSectionContainer } from "@/components/container/dashboard-section-container";
import { getUserListQueryOptions } from "@/features/user/actions/get-user-list";
import { getUserListCountQueryOptions } from "@/features/user/actions/get-user-list-count";
import { UsersTable } from "@/features/user/components/users-table";
import { authGuard } from "@/features/user/guards/auth-guard";
import { getQueryClient } from "@/lib/tanstack-query/get-query-client";
import { tryCatchAsync } from "@/lib/utils/try-catch-async";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Management",
};

export default async function AdminUser() {
  // AUTH GUARD
  const [currentUser, currentUserError] = await tryCatchAsync(authGuard());

  if (!currentUser || currentUserError) {
    return redirect("/");
  }
  // END OF AUTH GUARD

  const queryClient = getQueryClient();

  await Promise.allSettled([
    queryClient.prefetchQuery(
      getUserListQueryOptions({
        page: 1,
        pageSize: 10,
        columnFilters: [],
        sorting: [],
      }),
    ),
    queryClient.prefetchQuery(
      getUserListCountQueryOptions({
        columnFilters: [],
      }),
    ),
  ]);

  return (
    <DashboardSectionContainer>
      <h2 className="text-2xl font-semibold">User</h2>

      <HydrationBoundary state={dehydrate(queryClient)}>
        <UsersTable />
      </HydrationBoundary>
    </DashboardSectionContainer>
  );
}
