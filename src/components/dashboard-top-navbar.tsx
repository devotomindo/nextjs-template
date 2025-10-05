"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import Link from "next/link";
import { UserDropdown } from "./user-dropdown";

export function DashboardTopNavbar() {
  return (
    <nav className="bg-background/80 supports-[backdrop-filter]:bg-background/60 border-b px-4 backdrop-blur">
      <div className="flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <SidebarTrigger className="-ml-1" />

          {/* Logo and title - visible on mobile */}
          <Link href="/dashboard" className="flex items-center lg:hidden">
            {/* <Image
              src="/images/logo.png"
              alt="Logo"
              width={40}
              height={40}
              className="h-10 w-10"
            /> */}
            <span className="ml-3 hidden text-lg font-semibold text-gray-900 md:inline-block">
              NextJS Template
            </span>
          </Link>
        </div>

        {/* Right side - User dropdown */}
        <div className="flex items-center">
          <UserDropdown />
        </div>
      </div>
    </nav>
  );
}
