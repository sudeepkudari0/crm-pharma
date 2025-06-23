import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { ProspectsPipeline } from "@/components/dashboard/prospects-pipeline";
import { TasksOverview } from "@/components/dashboard/tasks-overview";
import { PerformanceChart } from "@/components/dashboard/performance-chart";
import { PerformanceChartSkeleton } from "@/components/dashboard/skeletons/performance-chart-skeleton";
import { Suspense } from "react";
import { UserRole, ProspectStatus, TaskStatus } from "@prisma/client";
import { ProspectsPipelineSkeleton } from "@/components/dashboard/skeletons/prospects-pipeline-skeleton";
import { DashboardStatsSkeleton } from "@/components/dashboard/skeletons/dashboard-stats-skeleton";
import { RecentActivitiesSkeleton } from "@/components/dashboard/skeletons/recent-activities-skeleton";
import { TasksOverviewSkeleton } from "@/components/dashboard/skeletons/tasks-overview-skeleton";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { redirect } from "next/navigation";

async function getDashboardData(userId: string, userRole: string) {
  const typedUserRole = userRole as UserRole;
  const isSysAdmin = typedUserRole === UserRole.SYS_ADMIN;
  const isAdmin = typedUserRole === UserRole.ADMIN;

  let relevantUserIds: string[] = [userId];

  if (isAdmin) {
    const accessRecords = await prisma.userAdminAccess.findMany({
      where: { adminId: userId },
      select: { userId: true },
    });
    relevantUserIds = [userId, ...accessRecords.map((r) => r.userId)];
  }

  const userFilterForOwnership = isSysAdmin
    ? {}
    : { userId: { in: relevantUserIds } };

  const userFilterForAssignedTasks = isSysAdmin
    ? {}
    : {
        OR: [
          {
            assignedToId: { in: relevantUserIds },
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
          },
          {
            createdById: userId,
            status: { in: [TaskStatus.PENDING, TaskStatus.IN_PROGRESS] },
          },
        ],
      };

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
  sixMonthsAgo.setDate(1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyDataPromises = [];
  for (let i = 0; i < 6; i++) {
    const monthStartDate = new Date(
      sixMonthsAgo.getFullYear(),
      sixMonthsAgo.getMonth() + i,
      1
    );
    const monthEndDate = new Date(
      sixMonthsAgo.getFullYear(),
      sixMonthsAgo.getMonth() + i + 1,
      0,
      23,
      59,
      59,
      999
    );

    monthlyDataPromises.push(
      Promise.all([
        prisma.prospect.count({
          where: {
            ...userFilterForOwnership,
            createdAt: {
              gte: monthStartDate,
              lte: monthEndDate,
            },
          },
        }),
        prisma.activity.count({
          where: {
            ...userFilterForOwnership,
            createdAt: {
              gte: monthStartDate,
              lte: monthEndDate,
            },
          },
        }),
        prisma.prospect.count({
          where: {
            ...userFilterForOwnership,
            status: ProspectStatus.CLOSED_WON,
            updatedAt: {
              gte: monthStartDate,
              lte: monthEndDate,
            },
          },
        }),
        Promise.resolve(monthStartDate),
      ])
    );
  }

  const monthlyResults = await Promise.all(monthlyDataPromises);
  const performanceChartData = monthlyResults.map(
    ([prospects, activities, conversions, monthDate]) => ({
      month: monthDate.toLocaleString("default", { month: "short" }),
      prospects,
      activities,
      conversions,
    })
  );

  const [
    totalProspects,
    activeProspects,
    completedActivities,
    pendingTasks,
    recentActivities,
    prospectsByStatus,
  ] = await Promise.all([
    prisma.prospect.count({ where: userFilterForOwnership }),
    prisma.prospect.count({
      where: {
        ...userFilterForOwnership,
        status: {
          in: [
            ProspectStatus.LEAD,
            ProspectStatus.QUALIFIED,
            ProspectStatus.PROPOSAL,
            ProspectStatus.NEGOTIATION,
          ],
        },
      },
    }),
    prisma.activity.count({
      where: {
        ...userFilterForOwnership,
      },
    }),
    prisma.task.count({
      where: {
        ...userFilterForAssignedTasks,
      },
    }),
    prisma.activity.findMany({
      where: userFilterForOwnership,
      include: {
        prospect: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.prospect.groupBy({
      by: ["status"],
      where: userFilterForOwnership,
      _count: true,
    }),
  ]);

  const wonProspectsCount =
    prospectsByStatus.find((p) => p.status === ProspectStatus.CLOSED_WON)
      ?._count || 0;
  const conversionRate =
    totalProspects > 0 ? (wonProspectsCount / totalProspects) * 100 : 0;

  return {
    stats: {
      totalProspects,
      activeProspects,

      completedActivities: await prisma.activity.count({
        where: { ...userFilterForOwnership, completedAt: { not: null } },
      }),
      pendingTasks,
      conversionRate: parseFloat(conversionRate.toFixed(1)),
      monthlyGrowth: 12.5,
    },
    recentActivities,
    prospectsByStatus,
    performanceChartData,
  };
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    return (
      <div className="p-6 text-center text-red-500">
        Session is invalid or user role is missing. Please try logging in again.
      </div>
    );
  }

  const data = await getDashboardData(session.user.id, session.user.role);

  return (
    <DashboardShell>
      <DashboardHeader
        heading={`Welcome back, ${session.user.name}!`}
        text="Here's what's happening with your sales pipeline today."
        user={session.user}
      />

      <Suspense fallback={<DashboardStatsSkeleton />}>
        <DashboardStats stats={data.stats} />
      </Suspense>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={<RecentActivitiesSkeleton />}>
          <RecentActivities activities={data.recentActivities} />
        </Suspense>
        <Suspense fallback={<TasksOverviewSkeleton />}>
          <TasksOverview
            userId={session.user.id}
            userRole={session.user.role}
          />
        </Suspense>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Suspense fallback={<PerformanceChartSkeleton />}>
            <PerformanceChart data={data.performanceChartData} />
          </Suspense>
        </div>
        <Suspense fallback={<ProspectsPipelineSkeleton />}>
          <ProspectsPipeline data={data.prospectsByStatus} />
        </Suspense>
      </div>
    </DashboardShell>
  );
}
