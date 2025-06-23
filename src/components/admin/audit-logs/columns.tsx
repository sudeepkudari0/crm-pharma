"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Info, Server, UserCircle, HardDrive, Clock } from "lucide-react";
import type { AuditLogWithUser } from "@/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(relativeTime);
dayjs.extend(LocalizedFormat);

const formatEnumString = (str: string | null | undefined): string => {
  if (!str) return "N/A";
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const actionColors: { [key: string]: string } = {
  CREATE: "bg-green-100 text-green-700 border-green-300",
  UPDATE: "bg-blue-100 text-blue-700 border-blue-300",
  DELETE: "bg-red-100 text-red-700 border-red-300",
  LOGIN_SUCCESS: "bg-emerald-100 text-emerald-700 border-emerald-300",
  LOGIN_FAILURE: "bg-amber-100 text-amber-700 border-amber-300",
  LOGOUT: "bg-slate-100 text-slate-700 border-slate-300",
  SESSION_START: "bg-sky-100 text-sky-700 border-sky-300",
  SESSION_HEARTBEAT: "bg-teal-100 text-teal-700 border-teal-300",
  SYSTEM_ERROR: "bg-rose-100 text-rose-700 border-rose-300",
  VIEW: "bg-purple-100 text-purple-700 border-purple-300",
};

export const auditLogsColumns: ColumnDef<AuditLogWithUser>[] = [
  {
    accessorKey: "timestamp",
    header: () => <div className="flex items-center">Timestamp</div>,
    size: 180,
    cell: ({ row }) => {
      const timestamp = row.original.timestamp;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs">
                <div>{dayjs(timestamp).format("MMM D, YYYY")}</div>
                <div className="text-muted-foreground">
                  {dayjs(timestamp).format("h:mm:ss A")}
                </div>
                <div className="text-sky-600 dark:text-sky-400">
                  {dayjs(timestamp).fromNow()}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>{dayjs(timestamp).format("llll Z")}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "user.name",
    header: () => <div className="flex items-center">Actor</div>,
    minSize: 200,
    cell: ({ row }) => {
      const user = row.original.user;
      const userName = row.original.userName;
      const displayUserName = user?.name || userName || "System/Unknown";
      const initials =
        displayUserName
          ?.split(" ")
          .map((n: string) => n[0])
          .join("")
          .toUpperCase() || "S";

      return user || userName ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={user?.avatar || ""} />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs">
                  <p
                    className="font-medium truncate max-w-[120px]"
                    title={displayUserName}
                  >
                    {displayUserName}
                  </p>
                  {user?.role && (
                    <p className="text-muted-foreground">
                      {formatEnumString(user.role)}
                    </p>
                  )}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-semibold">{displayUserName}</p>
              {user?.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
              {row.original.userId && (
                <p className="text-xs text-muted-foreground">
                  ID: {row.original.userId}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-xs text-muted-foreground italic">
          System/Anonymous
        </span>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    size: 180,
    cell: ({ row }) => {
      const action = row.original.action;
      const colorClass =
        actionColors[action] || "bg-gray-100 text-gray-800 border-gray-300";
      return (
        <Badge
          variant="outline"
          className={`text-xs ${colorClass} text-nowrap`}
        >
          {formatEnumString(action)}
        </Badge>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: () => <div className="flex items-center">Entity Type</div>,
    size: 150,
    cell: ({ row }) => {
      const entityType = row.original.entityType;
      return entityType ? (
        <span className="text-xs text-muted-foreground text-nowrap">
          {formatEnumString(entityType)}
        </span>
      ) : (
        <span className="text-xs text-muted-foreground italic">-</span>
      );
    },
  },
  {
    accessorKey: "entityId",
    header: "Entity ID",
    size: 220,
    cell: ({ row }) => {
      const entityId = row.original.entityId;
      return entityId ? (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs font-mono cursor-default truncate block max-w-[180px]">
                {entityId}
              </span>
            </TooltipTrigger>
            <TooltipContent>{entityId}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <span className="text-xs text-muted-foreground italic">-</span>
      );
    },
  },
  {
    id: "details",
    header: () => <div className="flex items-center">Details</div>,
    minSize: 250,
    cell: ({ row }) => {
      const details = row.original.details as any;
      if (!details)
        return <span className="text-xs text-muted-foreground italic">-</span>;

      let summary = "View Details";
      if (typeof details === "object" && details !== null) {
        if (details.changes && Object.keys(details.changes).length > 0) {
          summary = `Changes: ${Object.keys(details.changes)
            .slice(0, 2)
            .join(", ")}${
            Object.keys(details.changes).length > 2 ? "..." : ""
          }`;
        } else if (details.createdDataSnapshot || details.createdData) {
          summary = "Created Data Snapshot";
        } else if (details.deletedDataSnapshot) {
          summary = "Deleted Data Snapshot";
        } else if (details.error) {
          summary = `Error: ${String(details.error).substring(0, 30)}...`;
        } else if (Object.keys(details).length > 0) {
          summary = `Details: ${Object.keys(details)[0]}=${String(
            details[Object.keys(details)[0]]
          ).substring(0, 20)}...`;
        }
      } else if (typeof details === "string") {
        summary = details.substring(0, 40) + (details.length > 40 ? "..." : "");
      }

      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger className="text-left w-full">
              <div className="flex items-center text-xs text-blue-600 hover:underline cursor-pointer truncate max-w-[200px]">
                <Eye className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                {summary}
              </div>
            </TooltipTrigger>
            <TooltipContent className="max-w-lg bg-background text-foreground border shadow-lg p-3">
              <pre className="text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(details, null, 2)}
              </pre>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "ipAddress",
    header: () => <div className="flex items-center">IP</div>,
    size: 130,
    cell: ({ row }) => {
      const ip = row.original.ipAddress;
      return ip ? (
        <span className="text-xs text-muted-foreground font-mono">{ip}</span>
      ) : (
        <span className="text-xs text-muted-foreground italic">-</span>
      );
    },
  },
];
