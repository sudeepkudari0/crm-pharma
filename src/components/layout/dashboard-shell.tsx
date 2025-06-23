import type * as React from "react";

import { cn } from "@/lib/utils";

interface DashboardShellProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DashboardShell({
  children,
  className,
  ...props
}: DashboardShellProps) {
  return (
    <div className={cn("space-y-4 md:space-y-6", className)} {...props}>
      {children}
    </div>
  );
}
