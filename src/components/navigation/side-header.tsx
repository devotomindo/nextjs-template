"use client";

import { SidebarHeader, useSidebar } from "@/components/ui/sidebar";
import Link from "next/link";

export function SideHeader() {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className={`flex items-center px-2 py-1 group-data-[collapsible=icon]:px-0 ${isCollapsed ? "justify-center" : ""}`}
        >
          <span
            className={`text-xl font-semibold text-gray-900 transition-opacity duration-200 ${
              isCollapsed ? "hidden opacity-0" : "opacity-100"
            }`}
          >
            NextJS Template
          </span>
        </Link>
      </SidebarHeader>
    </>
  );
}
