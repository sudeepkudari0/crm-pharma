import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TasksOverviewSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-8 w-20 rounded-md" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(3)].map((_, index) => (
          <div
            key={index}
            className="flex items-start space-x-3 p-3 border rounded-lg"
          >
            <Skeleton className="h-5 w-5 rounded-sm mt-1" />
            <div className="flex-1 space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <Skeleton className="h-3 w-2/5" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
