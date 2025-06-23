import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ActivitiesTable } from "@/components/activities/activities-table";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";

async function getActivities(userId: string, userRole: string) {
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

  return await prisma.activity.findMany({
    where: userFilter,
    include: {
      user: true,
      prospect: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function ActivitiesPage() {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const activities = await getActivities(session.user.id, session.user.role);

  return (
    <DashboardShell>
      <DashboardHeader heading="Activities" user={session.user} />
      <ActivitiesTable activities={activities} role={session.user.role} />
    </DashboardShell>
  );
}
