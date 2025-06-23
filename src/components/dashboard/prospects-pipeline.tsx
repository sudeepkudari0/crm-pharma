"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface PipelineDataPoint {
  status: string;
  _count: number;
}
interface ProspectsPipelineProps {
  data: PipelineDataPoint[];
}

const statusColors: { [key: string]: string } = {
  LEAD: "hsl(var(--chart-1))",
  QUALIFIED: "hsl(var(--chart-2))",
  PROPOSAL: "hsl(var(--chart-3))",
  NEGOTIATION: "hsl(var(--chart-4))",
  CLOSED_WON: "hsl(var(--chart-5))",
  CLOSED_LOST: "hsl(var(--muted-foreground))",
};

const statusLabels: { [key: string]: string } = {
  LEAD: "Leads",
  QUALIFIED: "Qualified",
  PROPOSAL: "Proposals",
  NEGOTIATION: "Negotiations",
  CLOSED_WON: "Closed Won",
  CLOSED_LOST: "Closed Lost",
};

export function ProspectsPipeline({ data }: ProspectsPipelineProps) {
  const chartData = data
    .filter((item) => item._count > 0)
    .map((item) => ({
      name:
        statusLabels[item.status as keyof typeof statusLabels] || item.status,
      value: item._count,
      fill: statusColors[item.status as keyof typeof statusColors] || "#A9A9A9",
    }));

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Pipeline</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No pipeline data available.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              innerRadius={70}
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.fill}
                  stroke={entry.fill}
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                borderColor: "hsl(var(--border))",
                borderRadius: "0.5rem",
                fontSize: "0.875rem",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={40}
              iconSize={10}
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value} ({entry.payload?.value})
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
