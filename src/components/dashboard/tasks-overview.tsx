import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { UserRole, TaskStatus } from "@prisma/client";
import { Prisma } from "@prisma/client";

interface TasksOverviewProps {
  userId: string;
  userRole: string;
}

async function getTasks(userId: string, userRole: string) {
  const typedUserRole = userRole as UserRole;
  const isSysAdmin = typedUserRole === UserRole.SYS_ADMIN;
  const isAdmin = typedUserRole === UserRole.ADMIN;

  let whereClause: Prisma.TaskWhereInput = {
    status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
  };

  if (isSysAdmin) {
  } else if (isAdmin) {
    const accessRecords = await prisma.userAdminAccess.findMany({
      where: { adminId: userId },
      select: { userId: true },
    });
    const managedUserIds = accessRecords.map((r) => r.userId);
    const relevantUserIdsForAdmin = [userId, ...managedUserIds];

    whereClause.OR = [
      { assignedToId: { in: relevantUserIdsForAdmin } },
      { createdById: { in: relevantUserIdsForAdmin } },
    ];
  } else {
    whereClause.OR = [{ assignedToId: userId }, { createdById: userId }];
  }

  return await prisma.task.findMany({
    where: whereClause,
    include: {
      prospect: { select: { id: true, name: true, company: true } },
      assignedTo: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { dueDate: "asc" },
    take: 5,
  });
}

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckSquare,
  CANCELLED: Clock,
};

export async function TasksOverview({ userId, userRole }: TasksOverviewProps) {
  const tasks = await getTasks(userId, userRole);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Upcoming Tasks</CardTitle>
        <Button asChild size="sm">
          <Link href="/tasks">View All</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No upcoming tasks
          </p>
        ) : (
          tasks.map((task) => {
            const StatusIcon = statusIcons[task.status];
            return (
              <div
                key={task.id}
                className="flex items-start space-x-3 p-3 border rounded-lg"
              >
                <StatusIcon className="h-4 w-4 mt-1 text-muted-foreground" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{task.title}</p>
                    <Badge
                      variant="secondary"
                      className={priorityColors[task.priority]}
                    >
                      {task.priority.toLowerCase()}
                    </Badge>
                  </div>
                  {task.prospect && (
                    <p className="text-xs text-muted-foreground">
                      Related to: {task.prospect.name}
                    </p>
                  )}
                  {task.dueDate && (
                    <p className="text-xs text-muted-foreground">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
