import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/admin/users-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";

async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      adminAccess: true,
      userAccess: true,
    },
  });
}

export default async function UsersPage() {
  const session = await auth();

  if (!session?.user || !["SYS_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  const users = await getUsers();

  return (
    <DashboardShell>
      <DashboardHeader heading="Users" user={session.user} />
      <UsersTable users={users} currentUserRole={session.user.role} />
    </DashboardShell>
  );
}
