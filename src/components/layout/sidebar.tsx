"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  LayoutDashboard,
  Users,
  Activity,
  CheckSquare,
  UserCog,
  FileText,
  ChevronsRight,
  ChevronsLeft,
  SearchCode,
} from "lucide-react";
import { useSession } from "next-auth/react";
import Image from "next/image";

const navigation = [
  {
    name: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ASSOCIATE", "ADMIN", "SYS_ADMIN"],
  },
  {
    name: "Prospects",
    href: "/prospects",
    icon: Users,
    roles: ["ASSOCIATE", "ADMIN", "SYS_ADMIN"],
  },
  {
    name: "Activities",
    href: "/activities",
    icon: Activity,
    roles: ["ASSOCIATE", "ADMIN", "SYS_ADMIN"],
  },
  {
    name: "Tasks",
    href: "/tasks",
    icon: CheckSquare,
    roles: ["ASSOCIATE", "ADMIN", "SYS_ADMIN"],
  },
  {
    name: "Prospect Discovery",
    href: "/prospect-discovery",
    icon: SearchCode,
    roles: ["ASSOCIATE", "ADMIN", "SYS_ADMIN"],
  },
];

const adminNavigation = [
  {
    name: "User Management",
    href: "/admin/users",
    icon: UserCog,
    roles: ["SYS_ADMIN"],
  },
  {
    name: "Audit Logs",
    href: "/admin/audit-logs",
    icon: FileText,
    roles: ["SYS_ADMIN"],
  },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();
  const { data: session } = useSession();
  const currentUserRole = session?.user?.role as string | undefined;

  const filteredNavigation = currentUserRole
    ? navigation.filter((item) => item.roles.includes(currentUserRole))
    : [];

  const filteredAdminNavigation = currentUserRole
    ? adminNavigation.filter((item) => item.roles.includes(currentUserRole))
    : [];

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 1024px)");
    const listener = () => {
      if (mediaQuery.matches && !collapsed) {
      }
    };
    listener();
    mediaQuery.addEventListener("change", listener);
    return () => mediaQuery.removeEventListener("change", listener);
  }, [collapsed]);

  return (
    <div
      className={cn(
        "hidden md:flex relative h-full flex-col bg-gradient-to-b from-[#b3f0fb] to-[#f9badf] transition-all duration-300 ease-in-out",
        collapsed ? "md:w-16" : "md:w-64",
        className
      )}
    >
      <Link
        href="/dashboard"
        className="flex items-center bg-background m-2 rounded relative"
      >
        {/* <Image
          src="/images/logo-nobg.png"
          alt="logo"
          width={120}
          height={50}
          className={cn(
            "w-[120px] h-[50px] object-contain py-1 ",
            collapsed && "hidden"
          )}
        /> */}
        {!collapsed && (
          <h3 className="text-2xl font-bold bg-gradient-to-b transition-all duration-300 ease-in-out from-[#4dd0e8] to-[#e6399e] bg-clip-text text-transparent p-2">
            Pharma CRM
          </h3>
        )}

        <div className="absolute top-2 right-2 z-50 bg-background border shadow rounded">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              "h-8 font-bold w-8 text-blue-700",
              collapsed && "mx-auto"
            )}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </Link>

      <ScrollArea className={cn("flex-1 px-3 py-4", collapsed && "pt-10")}>
        <nav className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href + "/")) ||
              (item.href !== "/dashboard" &&
                pathname.startsWith(item.href) &&
                item.href.length > 1 &&
                pathname.length === item.href.length);
            return (
              <Link key={item.name} href={item.href} title={item.name}>
                <Button
                  variant={isActive ? "secondary" : "ghost"}
                  className={cn(
                    "w-full justify-start h-9",
                    collapsed &&
                      "px-0 w-10 h-10 flex items-center justify-center",
                    isActive &&
                      "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                  )}
                >
                  <item.icon className={cn("h-4 w-4", !collapsed && "mr-2")} />
                  {!collapsed && <span className="text-sm">{item.name}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>

        {filteredAdminNavigation.length > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-1">
              {!collapsed && (
                <h4 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Administration
                </h4>
              )}
              {filteredAdminNavigation.map((item) => {
                const isActive =
                  pathname === item.href ||
                  pathname.startsWith(item.href + "/");
                return (
                  <Link key={item.name} href={item.href} title={item.name}>
                    <Button
                      variant={isActive ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start h-9",
                        collapsed &&
                          "px-0 w-10 h-10 flex items-center justify-center",
                        isActive &&
                          "bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/50 dark:text-blue-300 dark:hover:bg-blue-900"
                      )}
                    >
                      <item.icon
                        className={cn("h-4 w-4", !collapsed && "mr-2")}
                      />
                      {!collapsed && (
                        <span className="text-sm">{item.name}</span>
                      )}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </ScrollArea>
    </div>
  );
}
