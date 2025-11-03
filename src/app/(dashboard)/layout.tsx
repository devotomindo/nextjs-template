import { AdminNavbar } from "@/components/navigation/admin-navbar";
import { AdminSidebar } from "@/components/navigation/admin-sidebar";
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
      <AdminSidebar />
      <SidebarInset>
        <AdminNavbar />
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
