import { Skeleton } from "@/components/ui/skeleton";

import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function PerformanceChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-1/2" />
      </CardHeader>
      <CardContent>
        <div className="w-full h-[300px] space-y-4 p-4">
          <Skeleton className="h-full w-full" />
          <div className="flex justify-around">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
