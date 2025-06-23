import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1">
          <Skeleton className="h-8 w-40 mb-1" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <Skeleton className="h-10 w-full sm:w-64 rounded-md" />
          <div className="flex items-center gap-2 flex-wrap">
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-32 rounded-md" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>

        <div className="rounded-md border">
          <div className="hidden md:flex bg-muted/50 p-4 border-b">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-5 flex-1 mx-2" />
            ))}
            <Skeleton className="h-5 w-20 ml-2" />
          </div>

          {[...Array(5)].map((_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="flex flex-col md:flex-row items-center p-4 border-b last:border-b-0 hover:bg-muted/20"
            >
              <div className="w-full md:w-1/4 lg:w-1/5 flex items-center space-x-3 py-2 md:py-0">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>

              {[...Array(6)].map((_, colIndex) => (
                <div
                  key={`cell-${rowIndex}-${colIndex}`}
                  className="w-full md:flex-1 py-2 md:py-0 md:px-2 hidden md:block"
                >
                  <Skeleton className="h-4 w-full md:w-3/4" />
                </div>
              ))}

              <div className="w-full md:hidden space-y-2 mt-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>

              <div className="w-full md:w-20 flex justify-end py-2 md:py-0 mt-2 md:mt-0">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between space-x-2 py-4 gap-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
            <Skeleton className="h-9 w-9 rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
