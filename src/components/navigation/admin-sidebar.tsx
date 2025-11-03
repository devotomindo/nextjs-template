"use client";

import { SideHeader } from "@/components/navigation/side-header";
import { SideNav, type SidebarItem } from "@/components/navigation/side-nav";
import { Sidebar, SidebarContent, SidebarRail } from "@/components/ui/sidebar";
import { HomeIcon } from "lucide-react";
import * as React from "react";

interface AdminSidebarProps extends React.ComponentProps<typeof Sidebar> {
  showEsignMenu?: boolean;
}

export function AdminSidebar({
  showEsignMenu = false,
  ...props
}: AdminSidebarProps) {
  const navItems: SidebarItem[] = [
    {
      label: "Admin",
      items: [
        {
          title: "Dashboard",
          url: "/dashboard",
          icon: HomeIcon,
        },
      ],
    },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SideHeader />
      <SidebarContent>
        <SideNav items={navItems} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
