import { DashboardNavbar } from "@/components/navigation/dashboard-navbar";
import { DashboardSidebar } from "@/components/navigation/dashboard-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authGuard } from "@/features/user/guards/auth-guard";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // check if user is logged in
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardNavbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
