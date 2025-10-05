"use client";

import { DashboardSideNav } from "@/components/dashboard-side-nav";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { HomeIcon } from "lucide-react";
import Link from "next/link";
import * as React from "react";

// This is sample data.
const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: HomeIcon,
    },
    // {
    //   title: "Settings",
    //   url: "#",
    //   icon: Settings2,
    //   items: [
    //     {
    //       title: "General",
    //       url: "#",
    //     },
    //     {
    //       title: "Team",
    //       url: "#",
    //     },
    //     {
    //       title: "Billing",
    //       url: "#",
    //     },
    //     {
    //       title: "Limits",
    //       url: "#",
    //     },
    //   ],
    // },
  ],
};

export function DashboardSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <Link
          href="/dashboard"
          className="flex items-center justify-center px-2 group-data-[collapsible=icon]:px-0"
        >
          {/* <Image
            src="/images/logo.png"
            alt="Logo"
            width={30}
            height={30}
            className={`transition-all duration-200 ${
              isCollapsed ? "h-4 w-4" : "h-8 w-8"
            }`}
          /> */}
          <span
            className={`ml-3 text-lg font-semibold text-gray-900 transition-opacity duration-200 ${
              isCollapsed ? "hidden opacity-0" : "opacity-100"
            }`}
          >
            NextJS Template
          </span>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <DashboardSideNav items={data.navMain} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
