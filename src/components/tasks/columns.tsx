"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  CheckSquare,
  Clock,
  AlertCircle,
  CalendarDays,
  Edit,
  Trash2,
  Check,
  UserCircle,
  Briefcase,
  Type,
  Info,
  Loader2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditTaskDialog } from "./edit-task-dialog";
import { DeleteTaskDialog } from "./delete-task-dialog";
import type { TaskWithRelations } from "@/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import LocalizedFormat from "dayjs/plugin/localizedFormat";
import { useSession } from "next-auth/react";

dayjs.extend(relativeTime);
dayjs.extend(LocalizedFormat);

const formatEnumString = (str: string | null | undefined): string => {
  if (!str) return "N/A";
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const statusIcons = {
  PENDING: Clock,
  IN_PROGRESS: AlertCircle,
  COMPLETED: CheckSquare,
  CANCELLED: Clock,
};
const statusColors: { [key: string]: string } = {
  PENDING: "bg-yellow-100 text-yellow-700 border-yellow-300",
  IN_PROGRESS: "bg-blue-100 text-blue-700 border-blue-300",
  COMPLETED: "bg-green-100 text-green-700 border-green-300",
  CANCELLED: "bg-slate-100 text-slate-600 border-slate-300",
};
const priorityColors: { [key: string]: string } = {
  LOW: "bg-gray-100 text-gray-700 border-gray-300",
  MEDIUM: "bg-sky-100 text-sky-700 border-sky-300",
  HIGH: "bg-orange-100 text-orange-700 border-orange-300",
  URGENT: "bg-red-100 text-red-700 border-red-300",
};
const taskTypeColors: { [key: string]: string } = {
  TASK: "bg-indigo-100 text-indigo-700 border-indigo-300",
  REQUEST: "bg-purple-100 text-purple-700 border-purple-300",
};

export const tasksColumns: ColumnDef<TaskWithRelations>[] = [
  {
    accessorKey: "title",
    header: "Task",
    minSize: 250,
    cell: ({ row }) => {
      const task = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <p
            className="font-semibold text-sm text-gray-800 dark:text-gray-200 truncate max-w-[200px]"
            title={task.title}
          >
            {task.title}
          </p>
          {task.description && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] cursor-default">
                    <Info className="inline h-3 w-3 mr-1" /> {task.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-md bg-background text-foreground border shadow-lg p-2.5"
                >
                  <p className="text-xs whitespace-pre-wrap">
                    {task.description}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "type",
    header: () => <div className="flex items-center">Type</div>,
    size: 120,
    cell: ({ row }) => {
      const taskType = row.original.type;
      const colorClass =
        taskTypeColors[taskType] || "bg-gray-100 text-gray-700 border-gray-300";
      return (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-1 ${colorClass} text-nowrap`}
        >
          {formatEnumString(taskType)}
        </Badge>
      );
    },
  },

  {
    id: "statusAndPriority",
    header: "Status / Priority",
    minSize: 180,
    cell: ({ row }) => {
      const { status, priority } = row.original;
      const StatusIcon = statusIcons[status] || Clock;
      return (
        <div className="flex flex-col space-y-1 text-xs">
          <Badge
            variant="outline"
            className={`${statusColors[status]} text-nowrap w-fit flex items-center`}
          >
            <StatusIcon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            {formatEnumString(status)}
          </Badge>
          <Badge
            variant="outline"
            className={`${priorityColors[priority]} text-nowrap w-fit`}
          >
            {formatEnumString(priority)}
          </Badge>
        </div>
      );
    },
  },

  {
    accessorKey: "assignedTo.name",
    header: () => <div className="flex items-center">Assigned To</div>,
    minSize: 180,
    cell: ({ row }) => {
      const assignedTo = row.original.assignedTo;
      if (!assignedTo)
        return (
          <span className="text-xs text-muted-foreground italic">
            Unassigned
          </span>
        );
      const initials =
        assignedTo.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "U";
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center space-x-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage
                    src={
                      assignedTo.avatar ||
                      `https:
                        assignedTo.name || "User"
                      )}&background=random`
                    }
                  />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span
                  className="text-xs truncate max-w-[120px]"
                  title={assignedTo.name || ""}
                >
                  {assignedTo.name}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{assignedTo.name}</p>
              {assignedTo.email && (
                <p className="text-xs text-muted-foreground">
                  {assignedTo.email}
                </p>
              )}
              {assignedTo.role && (
                <p className="text-xs text-muted-foreground">
                  Role: {formatEnumString(assignedTo.role)}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "dates",
    header: () => <div className="flex items-center">Dates</div>,
    minSize: 180,
    cell: ({ row }) => {
      const { dueDate, completedAt, status } = row.original;
      const isOverdue =
        dueDate &&
        dayjs(dueDate).isBefore(dayjs()) &&
        status !== "COMPLETED" &&
        status !== "CANCELLED";
      return (
        <div className="text-xs space-y-0.5">
          {dueDate ? (
            <div
              className={`flex items-center ${
                isOverdue ? "text-red-600 font-semibold" : ""
              }`}
              title={`Due: ${dayjs(dueDate).format("llll")}`}
            >
              <CalendarDays className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="text-nowrap">
                Due: {dayjs(dueDate).format("MMM D, YY LT")}
              </span>
            </div>
          ) : (
            <span className="text-muted-foreground italic">No due date</span>
          )}
          {completedAt && status === "COMPLETED" && (
            <div
              className="flex items-center text-green-600"
              title={`Completed: ${dayjs(completedAt).format("llll")}`}
            >
              <CheckSquare className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
              <span className="text-nowrap">
                Done: {dayjs(completedAt).fromNow()}
              </span>
            </div>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "prospect.name",
    header: () => <div className="flex items-center">Prospect</div>,
    minSize: 180,
    cell: ({ row }) => {
      const prospect = row.original.prospect;
      if (!prospect)
        return (
          <span className="text-xs text-muted-foreground italic">
            No prospect
          </span>
        );
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <div className="text-xs">
                <p
                  className="font-medium truncate max-w-[150px]"
                  title={prospect.name || ""}
                >
                  {prospect.name}
                </p>
                {prospect.company && (
                  <p
                    className="text-muted-foreground truncate max-w-[150px]"
                    title={prospect.company}
                  >
                    {prospect.company}
                  </p>
                )}
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs font-medium">{prospect.name}</p>
              {prospect.company && (
                <p className="text-xs text-muted-foreground">
                  {prospect.company}
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "audit",
    header: "Created By",
    minSize: 170,
    cell: ({ row }) => {
      const { createdBy, createdAt } = row.original;
      const creatorInitials =
        createdBy?.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "U";
      return (
        <div className="text-xs space-y-0.5">
          {createdBy && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center space-x-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarImage
                        src={
                          createdBy.avatar ||
                          `https:
                            createdBy.name || "User"
                          )}&background=random`
                        }
                      />
                      <AvatarFallback className="text-xxs">
                        {creatorInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span
                      className="truncate max-w-[90px]"
                      title={createdBy.name || ""}
                    >
                      {createdBy.name}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Created by: {createdBy.name}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <div
            className="text-muted-foreground"
            title={dayjs(createdAt).format("llll")}
          >
            Logged: {dayjs(createdAt).fromNow()}
          </div>
        </div>
      );
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    size: 80,
    cell: ({ row }) => {
      const task = row.original;
      const router = useRouter();

      const { data: session } = useSession();

      const [showEditDialog, setShowEditDialog] = useState(false);

      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      const [isMarkingComplete, setIsMarkingComplete] = useState(false);

      const currentUser = session?.user;
      const currentUserId = currentUser?.id;
      const currentUserRole = currentUser?.role as string | undefined;

      const isAdminOrSysAdmin =
        currentUserRole === "ADMIN" || currentUserRole === "SYS_ADMIN";

      const canEditDelete =
        isAdminOrSysAdmin || task.createdById === currentUserId;

      const canMarkComplete =
        task.assignedToId === currentUserId || isAdminOrSysAdmin;

      const handleMarkComplete = async () => {
        setIsMarkingComplete(true);
        try {
          const response = await fetch(`/api/tasks/${task.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              status: "COMPLETED",
              completedAt: new Date().toISOString(),

              type: task.type,
            }),
          });
          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Failed to mark task as complete" }));
            throw new Error(
              errorData.message || "Failed to mark task as complete"
            );
          }
          toast.success("Task marked as complete!");
          router.refresh();
        } catch (error: any) {
          toast.error(error.message || "Could not mark task complete.");
        } finally {
          setIsMarkingComplete(false);
        }
      };

      const anyActionAvailable =
        canEditDelete ||
        (canMarkComplete &&
          task.status !== "COMPLETED" &&
          task.status !== "CANCELLED");

      if (!currentUser || !anyActionAvailable) {
        return (
          <div className="text-right">
            <Button variant="ghost" size="icon" className="h-8 w-8" disabled>
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        );
      }

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Task Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {canEditDelete && (
                <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                  <Edit className="h-3.5 w-3.5 mr-2" />
                  Edit Task
                </DropdownMenuItem>
              )}
              {canMarkComplete &&
                task.status !== "COMPLETED" &&
                task.status !== "CANCELLED" && (
                  <DropdownMenuItem
                    onClick={handleMarkComplete}
                    disabled={isMarkingComplete}
                  >
                    {isMarkingComplete ? (
                      <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5 mr-2" />
                    )}
                    Mark Complete
                  </DropdownMenuItem>
                )}
              {canEditDelete && (
                <DropdownMenuItem
                  className="text-red-600 hover:!text-red-600 focus:!text-red-600"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {showEditDialog && canEditDelete && (
            <EditTaskDialog
              key={`edit-${task.id}-${showEditDialog}`}
              task={task}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}
          {showDeleteDialog && canEditDelete && (
            <DeleteTaskDialog
              key={`delete-${task.id}-${showDeleteDialog}`}
              task={task}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />
          )}
        </div>
      );
    },
  },
];
