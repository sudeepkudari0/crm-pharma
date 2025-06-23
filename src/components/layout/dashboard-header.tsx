"use client";

import { UserNav } from "./user-nav";

interface DashboardHeaderProps {
  heading: string | React.ReactNode;
  text?: string;
  children?: React.ReactNode;
  user: any;
}

export function DashboardHeader({
  heading,
  text,
  children,
  user,
}: DashboardHeaderProps) {
  return (
    <div className="relative hidden md:flex justify-between items-center pr-6 overflow-hidden shadow-sm bg-white rounded-lg">
      <div className="relative flex flex-col justify-between gap-6 py-4 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-3">
            {/* Decorative accent */}
            <div className="h-8 w-1 rounded-full" />
            <h1 className="font-heading bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-2xl font-bold tracking-tight text-transparent dark:from-slate-100 dark:via-slate-200 dark:to-slate-100 md:text-3xl">
              {heading}
            </h1>
          </div>
          {text && (
            <p className="ml-4 max-w-2xl text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">
              {text}
            </p>
          )}
        </div>
      </div>
      <div>
        <UserNav user={user} />
      </div>
    </div>
  );
}
