import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TasksTable } from "@/components/tasks/tasks-table";
import { Prisma, UserRole } from "@prisma/client";
import { TaskWithRelations } from "@/types";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";

async function getTasks(userId: string, userRole: string) {
  const typedUserRole = userRole as UserRole;
  const isSysAdmin = typedUserRole === UserRole.SYS_ADMIN;
  const isAdmin = typedUserRole === UserRole.ADMIN;

  let whereClause: Prisma.TaskWhereInput = {};

  if (isSysAdmin) {
    whereClause = {};
  } else if (isAdmin) {
    const accessRecords = await prisma.userAdminAccess.findMany({
      where: { adminId: userId },
      select: { userId: true },
    });
    const managedUserIds = accessRecords.map((r) => r.userId);

    whereClause = {
      OR: [
        { assignedToId: { in: [userId, ...managedUserIds] } },
        { createdById: { in: [userId, ...managedUserIds] } },
      ],
    };
  } else {
    whereClause = {
      OR: [{ assignedToId: userId }, { createdById: userId }],
    };
  }

  return await prisma.task.findMany({
    where: whereClause,
    include: {
      createdBy: true,
      assignedTo: true,
      prospect: { select: { id: true, name: true, company: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export default async function TasksPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return (
      <div className="p-6 text-center text-red-500">
        User session is invalid or role is missing. Please log in again.
      </div>
    );
  }

  const tasks = await getTasks(session.user.id, session.user.role);

  return (
    <DashboardShell>
      <DashboardHeader heading="Tasks" user={session.user} />
      <TasksTable tasks={tasks as TaskWithRelations[]} />
    </DashboardShell>
  );
}
