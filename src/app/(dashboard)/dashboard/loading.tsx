import { DashboardStatsSkeleton } from "@/components/dashboard/skeletons/dashboard-stats-skeleton";
import { RecentActivitiesSkeleton } from "@/components/dashboard/skeletons/recent-activities-skeleton";
import { TasksOverviewSkeleton } from "@/components/dashboard/skeletons/tasks-overview-skeleton";
import { PerformanceChartSkeleton } from "@/components/dashboard/skeletons/performance-chart-skeleton";
import { ProspectsPipelineSkeleton } from "@/components/dashboard/skeletons/prospects-pipeline-skeleton";

export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
      </div>
      <DashboardStatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivitiesSkeleton />
        <TasksOverviewSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PerformanceChartSkeleton />
        </div>
        <ProspectsPipelineSkeleton />
      </div>
    </div>
  );
}
