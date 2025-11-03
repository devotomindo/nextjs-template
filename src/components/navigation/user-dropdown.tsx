"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { authClient } from "@/lib/auth/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronDownIcon, Loader2, LogOutIcon, UserIcon } from "lucide-react";
import { useRouter } from "nextjs-toploader/app";

export function UserDropdown() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: session } = authClient.useSession();

  const signOutMutation = useMutation({
    mutationFn: async () => {
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            // Clear all TanStack Query cache on logout
            queryClient.clear();
            router.push("/");
          },
        },
      });
    },
  });

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-md py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
          <UserIcon className="h-4 w-4 text-gray-600" />
        </div>
        <span>{session?.user?.name || "User"}</span>
        <ChevronDownIcon className="h-4 w-4" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem
          variant="destructive"
          onClick={(e) => {
            e.preventDefault();
            signOutMutation.mutate();
          }}
          disabled={signOutMutation.isPending}
        >
          {signOutMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <LogOutIcon className="mr-2 h-4 w-4" />
          )}
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
