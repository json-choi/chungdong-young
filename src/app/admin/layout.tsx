import { redirect } from "next/navigation";
import { getAdminSession } from "@/server/auth/guard";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return (
    <div className="h-screen flex bg-church-bg overflow-hidden">
      <AdminSidebar userName={session.user.name} />
      <main className="flex-1 min-w-0 pt-14 lg:pt-0 overflow-y-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
