import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { DashboardTopNavbar } from "@/components/dashboard-top-navbar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { authGuard } from "@/features/user/guards/auth-guard";
import { redirect } from "next/navigation";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // check if user is logged in and are an admin
  const [session, error] = await authGuard();

  if (error || !session) {
    redirect("/");
  }

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <DashboardTopNavbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
