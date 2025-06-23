"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ChartDataPoint {
  month: string;
  prospects: number;
  activities: number;
  conversions: number;
}

interface PerformanceChartProps {
  data: ChartDataPoint[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Performance Trends</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            No performance data available for the selected period.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance Trends (Last 6 Months)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.5} />
            <XAxis
              dataKey="month"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="monotone"
              dataKey="prospects"
              name="New Prospects"
              stroke="hsl(var(--primary))"
              strokeWidth={2.5}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
            />
            <Line
              type="monotone"
              dataKey="activities"
              name="Activities Logged"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2.5}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
            />
            <Line
              type="monotone"
              dataKey="conversions"
              name="Conversions"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2.5}
              dot={{
                r: 4,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
              activeDot={{
                r: 6,
                strokeWidth: 2,
                fill: "hsl(var(--primary-foreground))",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
