"use client";

import { ChevronRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";

export type SidebarItem = {
  label?: string;
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    activeMatch?: "startsWith" | "exact";
    items?: {
      title: string;
      url: string;
      activeMatch?: "startsWith" | "exact";
    }[];
  }[];
};

const SidebarTopLevel = ({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) => {
  return (
    <>
      {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
      <SidebarMenu>{children}</SidebarMenu>
    </>
  );
};

export function SideNav({ items }: { items: SidebarItem[] }) {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();

  const handleLinkClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  const checkIsActive = (url: string, activeMatch?: "startsWith" | "exact") => {
    const matchType = activeMatch ?? "startsWith";
    return matchType === "exact" ? pathname === url : pathname.startsWith(url);
  };

  return (
    <SidebarGroup>
      {items.map((item, index) => {
        const menu = item.items.map((item2) => {
          const hasSubItems = item2.items && item2.items.length > 0;
          const isMenuActive = checkIsActive(item2.url, item2.activeMatch);
          const isSubItemActive =
            hasSubItems &&
            item2.items?.some((subItem) =>
              checkIsActive(subItem.url, subItem.activeMatch),
            );
          const shouldOpenCollapsible = isMenuActive || isSubItemActive;

          return hasSubItems ? (
            <Collapsible
              key={item2.title}
              asChild
              defaultOpen={shouldOpenCollapsible}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={item2.title}
                    isActive={isMenuActive}
                  >
                    {item2.icon && <item2.icon />}
                    <span>{item2.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item2.items?.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton
                          asChild
                          isActive={checkIsActive(
                            subItem.url,
                            subItem.activeMatch,
                          )}
                        >
                          <Link
                            href={subItem.url as any}
                            onClick={handleLinkClick}
                          >
                            <span>{subItem.title}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={item2.title}>
              <SidebarMenuButton
                asChild
                tooltip={item2.title}
                isActive={isMenuActive}
              >
                <Link href={item2.url as any} onClick={handleLinkClick}>
                  {item2.icon && <item2.icon />}
                  <span>{item2.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        });

        return (
          <SidebarTopLevel key={item.label ?? index} label={item.label}>
            {menu}
          </SidebarTopLevel>
        );
      })}
    </SidebarGroup>
  );
}
