"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Activity,
  CheckSquare,
  UserCog,
  FileText,
  Settings2,
  SearchCode,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";

const primaryMobileNavigationItems = [
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

const adminSubNavigationItems = [
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

export function BottomNavigation() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const currentUserRole = session?.user?.role as string | undefined;
  const [isAdminPopoverOpen, setIsAdminPopoverOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="fixed inset-x-0 bottom-0 z-50 h-16 border-t bg-background md:hidden">
        <div className="flex h-full items-center justify-around animate-pulse">
          <div className="h-10 w-12 bg-muted rounded-md"></div>
          <div className="h-10 w-12 bg-muted rounded-md"></div>
          <div className="h-10 w-12 bg-muted rounded-md"></div>
          <div className="h-10 w-12 bg-muted rounded-md"></div>
        </div>
      </div>
    );
  }

  if (!currentUserRole) {
    return null;
  }

  const visiblePrimaryItems = primaryMobileNavigationItems.filter((item) =>
    item.roles.includes(currentUserRole)
  );

  const availableAdminSubItems = adminSubNavigationItems.filter((item) =>
    item.roles.includes(currentUserRole)
  );

  let finalMobileItems = [...visiblePrimaryItems];

  if (availableAdminSubItems.length > 0) {
    finalMobileItems.push({
      name: "Admin",
      href: "#admin-menu",
      icon: Settings2,
      roles: ["SYS_ADMIN"],
    });
  }

  finalMobileItems = finalMobileItems.slice(0, 5);

  if (finalMobileItems.length === 0) {
    return null;
  }

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background shadow-t-lg md:hidden">
      <div className="flex h-16 items-center justify-around px-1">
        {finalMobileItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" &&
              item.href !== "#admin-menu" &&
              pathname.startsWith(item.href + "/")) ||
            (item.href !== "/dashboard" &&
              item.href !== "#admin-menu" &&
              item.href.length > 1 &&
              pathname.length === item.href.length &&
              pathname.startsWith(item.href));

          if (item.href === "#admin-menu") {
            return (
              <Popover
                key={item.name}
                open={isAdminPopoverOpen}
                onOpenChange={setIsAdminPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center space-y-0.5 p-1 rounded-md flex-1 max-w-[20%]",
                      "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out",
                      (isActive || isAdminPopoverOpen) &&
                        "text-blue-600 dark:text-blue-400 bg-accent"
                    )}
                    onClick={() => setIsAdminPopoverOpen(true)}
                  >
                    <item.icon
                      className={cn(
                        "h-5 w-5 mb-0.5",
                        isActive || isAdminPopoverOpen
                          ? "text-blue-600 dark:text-blue-400"
                          : ""
                      )}
                      strokeWidth={isActive || isAdminPopoverOpen ? 2.25 : 1.75}
                    />
                    <span
                      className={cn(
                        "text-[10px] font-medium leading-tight",
                        isActive || isAdminPopoverOpen
                          ? "text-blue-600 dark:text-blue-400"
                          : ""
                      )}
                    >
                      {item.name}
                    </span>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  side="top"
                  align="center"
                  className="w-56 p-2 mb-1"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  <div className="space-y-1">
                    {availableAdminSubItems.map((subItem) => {
                      const isSubItemActive =
                        pathname === subItem.href ||
                        pathname.startsWith(subItem.href + "/");
                      return (
                        <Link
                          key={subItem.name}
                          href={subItem.href}
                          onClick={() => setIsAdminPopoverOpen(false)}
                          className={cn(
                            "flex items-center space-x-2 p-2 rounded-md text-sm hover:bg-accent",
                            isSubItemActive &&
                              "bg-accent text-accent-foreground font-medium"
                          )}
                        >
                          <subItem.icon className="h-4 w-4 text-muted-foreground" />
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            );
          }

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center space-y-0.5 p-1 rounded-md flex-1 max-w-[20%]",
                "text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors duration-150 ease-in-out",
                isActive && "text-blue-600 dark:text-blue-400"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 mb-0.5",
                  isActive ? "text-blue-600 dark:text-blue-400" : ""
                )}
                strokeWidth={isActive ? 2.25 : 1.75}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-tight",
                  isActive ? "text-blue-600 dark:text-blue-400" : ""
                )}
              >
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
