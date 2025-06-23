import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Target, Activity, CheckSquare, TrendingUp, Percent } from "lucide-react"
import type { DashboardStats } from "@/types"

interface DashboardStatsProps {
  stats: DashboardStats
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Prospects",
      value: stats.totalProspects,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Active Prospects",
      value: stats.activeProspects,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Activities Completed",
      value: stats.completedActivities,
      icon: Activity,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: CheckSquare,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate.toFixed(1)}%`,
      icon: Percent,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Monthly Growth",
      value: `+${stats.monthlyGrowth}%`,
      icon: TrendingUp,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
