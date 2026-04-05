import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminLogout from "@/components/AdminLogout";
import AdminThemeWrapper from "@/components/AdminThemeWrapper";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as { isAdmin?: boolean })?.isAdmin;

  if (!session) redirect("/login");
  if (!isAdmin) redirect("/");

  return (
    <AdminThemeWrapper email={session.user?.email ?? ""}>
      {children}
    </AdminThemeWrapper>
  );
}
