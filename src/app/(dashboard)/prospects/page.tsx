import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ProspectsTable } from "@/components/prospects/prospects-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";

async function getProspects(userId: string, userRole: string) {
  const isSysAdmin = userRole === "SYS_ADMIN";
  const isAdmin = userRole === "ADMIN";

  let relevantUserIds: string[] = [userId];

  if (isAdmin) {
    const accessRecords = await prisma.userAdminAccess.findMany({
      where: { adminId: userId },
      select: { userId: true },
    });

    relevantUserIds = [userId, ...accessRecords.map((r) => r.userId)];
  }

  const userFilter = isSysAdmin ? {} : { userId: { in: relevantUserIds } };

  return await prisma.prospect.findMany({
    where: userFilter,
    include: {
      user: true,
      activities: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      tasks: {
        where: { status: { in: ["PENDING", "IN_PROGRESS"] } },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export default async function ProspectsPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const prospects = await getProspects(session.user.id, session.user.role);

  return (
    <DashboardShell>
      <DashboardHeader heading="Prospects" user={session.user} />
      <ProspectsTable prospects={prospects} />
    </DashboardShell>
  );
}
