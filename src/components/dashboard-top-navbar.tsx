"use client";

import Link from "next/link";
import { UserDropdown } from "./user-dropdown";

export function DashboardTopNavbar() {
  return (
    <nav className="bg-background/80 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 border-b backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center">
              <span className="ml-3 text-lg font-semibold text-gray-900">
                Nextjs Template Dashboard
              </span>
            </Link>
          </div>

          {/* Right side - User dropdown */}
          <div className="flex items-center">
            <UserDropdown />
          </div>
        </div>
      </div>
    </nav>
  );
}
