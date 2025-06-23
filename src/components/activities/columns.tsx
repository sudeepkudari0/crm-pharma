"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Phone,
  Mail,
  MessageSquare,
  Calendar as CalendarIconLucide,
  Users,
  MapPin,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Info,
  UserCircle,
  Clock,
  CheckSquare,
  Square,
  XSquare,
  Pencil,
  LucideCalendar,
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
import { EditActivityDialog } from "./edit-activity-dialog";
import { DeleteActivityDialog } from "./delete-activity-dialog";
import type { ActivityWithRelations } from "@/types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Action } from "@radix-ui/react-toast";
import { EditNextActionDialog } from "./edit-next-action-dialog";
import { NextActionStatus } from "@prisma/client";
import { formatEnumString } from "@/lib/utils";

dayjs.extend(relativeTime);

const activityIcons = {
  CALL: Phone,
  EMAIL: Mail,
  WHATSAPP: MessageSquare,
  MEETING: Users,
  VISIT: MapPin,
  FOLLOW_UP: CalendarIconLucide,
  PRESENTATION: Users,
  SAMPLE_DROP: Package,
  ORDER_COLLECTION: DollarSign,
  OTHER: Info,
};

const activityColors = {
  CALL: "bg-blue-100 text-blue-800 hover:bg-blue-200",
  EMAIL: "bg-green-100 text-green-800 hover:bg-green-200",
  WHATSAPP: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
  MEETING: "bg-purple-100 text-purple-800 hover:bg-purple-200",
  VISIT: "bg-orange-100 text-orange-800 hover:bg-orange-200",
  FOLLOW_UP: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200",
  PRESENTATION: "bg-indigo-100 text-indigo-800 hover:bg-indigo-200",
  SAMPLE_DROP: "bg-pink-100 text-pink-800 hover:bg-pink-200",
  ORDER_COLLECTION: "bg-teal-100 text-teal-800 hover:bg-teal-200",
  OTHER: "bg-gray-100 text-gray-800 hover:bg-gray-200",
};

const formatCurrency = (amount: number | null | undefined) => {
  if (amount === null || amount === undefined) return "N/A";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);
};

const SampleDisplay = ({
  samples,
}: {
  samples: ActivityWithRelations["samplesProvided"];
}) => {
  if (!samples || (Array.isArray(samples) && samples.length === 0)) {
    return <span className="text-xs text-muted-foreground">None</span>;
  }
  const displayCount = 2;
  const firstSamples = (samples as any)
    .slice(0, displayCount)
    .map((s: any) => `${s.productId} (x${s.quantity})`)
    .join(", ");
  const remainingCount =
    (Array.isArray(samples) ? samples.length : 0) - displayCount;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger className="text-left">
          <div className="flex items-center text-xs">
            <Package className="h-3 w-3 mr-1 flex-shrink-0" />
            <span className="truncate">
              {firstSamples}
              {remainingCount > 0 && ` +${remainingCount} more`}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs" side="top">
          <ul className="list-disc pl-4">
            {(samples as any).map((s: any, i: any) => (
              <li key={i}>
                {s.productId} (Strips: {s.quantity})
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const activitiesColumns: ColumnDef<ActivityWithRelations>[] = [
  {
    accessorKey: "type",
    header: "Type",
    size: 120,
    cell: ({ row }) => {
      const activity = row.original;
      const Icon = activityIcons[activity.type] || Info;
      const colorClass = activityColors[activity.type] || activityColors.OTHER;
      return (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-1 ${colorClass} border-transparent`}
        >
          <Icon className="h-3.5 w-3.5 mr-1.5" />
          <span className="capitalize text-nowrap">
            {activity.type.replace("_", " ").toLowerCase()}
          </span>
        </Badge>
      );
    },
  },
  {
    id: "user.name",
    accessorKey: "user.name",
    header: "Logged By",
    size: 150,
    cell: ({ row }) => {
      const user = row.original.user;
      if (!user)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      const initials =
        user.name
          ?.split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "U";
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={
                      user.avatar ||
                      `https:
                        user.name || "User"
                      )}&background=random`
                    }
                  />
                  <AvatarFallback className="text-xs">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs truncate">{user.name}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{user.name}</p>
              {user.email && (
                <p className="text-xs text-muted-foreground">{user.email}</p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },
  {
    accessorKey: "subject",
    header: "Subject",
    minSize: 250,
    cell: ({ row }) => {
      const activity = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <p className="font-semibold text-sm leading-tight text-gray-800 dark:text-gray-200 text-nowrap truncate max-w-[200px]">
            {activity.subject}
          </p>
          {activity.description && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px] cursor-default text-nowrap">
                    {activity.description}
                  </p>
                </TooltipTrigger>
                <TooltipContent
                  side="bottom"
                  align="start"
                  className="max-w-md bg-background text-foreground border shadow-lg p-2.5"
                >
                  <h3 className="text-sm font-semibold text-nowrap pb-1">
                    {activity.subject}
                  </h3>
                  <p className="text-xs">{activity.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "prospect.name",
    header: "Prospect",
    minSize: 200,
    cell: ({ row }) => {
      const { prospect } = row.original;
      const initials =
        prospect.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "P";
      return (
        <div className="flex items-center space-x-2.5">
          <Avatar className="h-7 w-7">
            <AvatarFallback className="text-xs font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="font-medium text-xs text-gray-700 dark:text-gray-300 text-nowrap">
              {prospect.name}
            </p>
            {prospect.company && (
              <p className="text-xs text-muted-foreground text-nowrap">
                {prospect.company}
              </p>
            )}
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "scheduledAt",
    header: () => (
      <div className="flex items-center">
        <span className="text-nowrap">Activity Date</span>
      </div>
    ),
    size: 150,
    cell: ({ row }) => {
      const scheduledAt = row.original.scheduledAt;
      if (!scheduledAt)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      return (
        <div className="flex flex-col text-xs">
          <span>{dayjs(scheduledAt).format("MMM D, YYYY")}</span>
          <span className="text-muted-foreground">
            {dayjs(scheduledAt).format("h:mm A")}
          </span>
        </div>
      );
    },
  },

  {
    accessorKey: "duration",
    header: () => <div className="flex items-center">Duration</div>,
    size: 100,
    cell: ({ row }) => {
      const duration = row.original.duration;
      return duration ? (
        <span className="text-xs">{duration} min</span>
      ) : (
        <span className="text-xs text-muted-foreground">N/A</span>
      );
    },
  },

  {
    accessorKey: "samplesProvided",
    header: "Samples",
    minSize: 180,
    cell: ({ row }) => <SampleDisplay samples={row.original.samplesProvided} />,
  },

  {
    id: "orderInfo",
    header: "Order Info",
    minSize: 150,
    cell: ({ row }) => {
      const { orderDiscussed, orderAmount } = row.original;
      return (
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center">
            {orderDiscussed ? (
              <CheckSquare className="h-3.5 w-3.5 mr-1.5 text-green-500" />
            ) : (
              <XSquare className="h-3.5 w-3.5 mr-1.5 text-red-500" />
            )}
            <label htmlFor={`order-${row.id}`} className="text-nowrap">
              Order Discussed
            </label>
          </div>
          {orderDiscussed && (
            <div className="flex items-center text-muted-foreground text-nowrap">
              Amount: {formatCurrency(orderAmount)}
            </div>
          )}
        </div>
      );
    },
  },

  {
    accessorKey: "outcome",
    header: "Outcome",
    minSize: 180,
    cell: ({ row }) => {
      const outcome = row.original.outcome;
      if (!outcome)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger className="text-left">
              <p className="text-xs line-clamp-2">{outcome}</p>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-sm bg-background text-foreground border shadow-lg p-2.5"
            >
              <p className="text-xs whitespace-pre-wrap">{outcome}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "nextActionInfo",
    header: "Next Action",
    minSize: 200,
    cell: ({ row }) => {
      const activity = row.original;
      const {
        nextActionType,
        nextActionDetails,
        nextActionDate,
        nextActionReminderSent,
        nextActionStatus,
      } = activity;
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const [showEditNextAction, setShowEditNextAction] = useState(false);

      if (
        !nextActionType &&
        !nextActionDate &&
        (!nextActionStatus || nextActionStatus === NextActionStatus.PENDING)
      ) {
        // If no next action is defined and status is effectively pending (or null, which defaults to pending)
        // Allow setting one up
        return (
          <Button
            variant="outline"
            size="sm"
            className="text-xs"
            onClick={() => setShowEditNextAction(true)}
          >
            <LucideCalendar className="mr-1.5 h-3.5 w-3.5" /> Set Next Action
          </Button>
        );
      }

      const typeDisplay = nextActionType
        ? formatEnumString(nextActionType)
        : "Action";
      const dateDisplay = nextActionDate
        ? dayjs(nextActionDate).format("MMM D, YY h:mm A")
        : "No date";
      const isOverdue =
        nextActionDate &&
        dayjs(nextActionDate).isBefore(dayjs()) &&
        (nextActionStatus === NextActionStatus.PENDING ||
          nextActionStatus === NextActionStatus.RESCHEDULED) &&
        !nextActionReminderSent;

      const statusDisplay = nextActionStatus
        ? formatEnumString(nextActionStatus)
        : "Pending";
      let statusColor = "text-muted-foreground";
      if (nextActionStatus === NextActionStatus.COMPLETED)
        statusColor = "text-green-600";
      else if (nextActionStatus === NextActionStatus.CANCELLED)
        statusColor = "text-red-600";
      else if (isOverdue) statusColor = "text-orange-500";

      return (
        <>
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger
                className="text-left w-full group"
                onClick={() => setShowEditNextAction(true)}
              >
                <div className="flex flex-col text-xs p-1 rounded-md group-hover:bg-accent cursor-pointer">
                  <div className="flex justify-between items-center">
                    <span
                      className={`font-medium capitalize text-nowrap ${
                        isOverdue ? "text-red-600" : ""
                      }`}
                    >
                      {typeDisplay}
                    </span>
                    <Edit className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <span
                    className={`text-muted-foreground text-nowrap ${
                      isOverdue ? "text-red-500" : ""
                    }`}
                  >
                    Due: {dateDisplay}
                  </span>
                  {nextActionDetails && (
                    <p
                      className="line-clamp-1 text-gray-500 dark:text-gray-400 text-xs mt-0.5 text-nowrap"
                      title={nextActionDetails}
                    >
                      {nextActionDetails}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-1">
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColor} border-current`}
                    >
                      {statusDisplay}
                    </Badge>
                    {nextActionReminderSent &&
                      (nextActionStatus === NextActionStatus.PENDING ||
                        nextActionStatus === NextActionStatus.RESCHEDULED) && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-sky-50 border-sky-200 text-sky-700"
                        >
                          Reminder Sent
                        </Badge>
                      )}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent
                side="top"
                align="start"
                className="max-w-xs bg-background text-foreground border shadow-lg p-2.5"
              >
                <p className="font-semibold capitalize">
                  {typeDisplay}{" "}
                  <span className={`text-xs normal-case text-muted-foreground`}>
                    ({statusDisplay})
                  </span>
                </p>
                <p>
                  <strong>Due:</strong> {dateDisplay}
                </p>
                {nextActionDetails && (
                  <p>
                    <strong>Details:</strong> {nextActionDetails}
                  </p>
                )}
                {nextActionReminderSent &&
                  (nextActionStatus === NextActionStatus.PENDING ||
                    nextActionStatus === NextActionStatus.RESCHEDULED) && (
                    <p className="text-sky-600">Reminder was sent.</p>
                  )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          {showEditNextAction && activity && (
            <EditNextActionDialog
              key={`edit-na-${activity.id}-${showEditNextAction}`}
              activity={activity}
              open={showEditNextAction}
              onOpenChange={setShowEditNextAction}
            />
          )}
        </>
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: () => (
      <div className="flex items-center">
        <span className="text-nowrap">Logged On</span>
      </div>
    ),
    size: 130,
    cell: ({ row }) => {
      const createdAt = row.original.createdAt;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <span className="text-xs text-muted-foreground text-nowrap">
                {dayjs(createdAt).fromNow()}
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs text-nowrap">
                {dayjs(createdAt).format("MMM D, YYYY, h:mm A")}
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    size: 80,
    cell: ({ row }) => {
      const activity = row.original;

      const [showEditDialog, setShowEditDialog] = useState(false);

      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      const [showNextActionDialog, setShowNextActionDialog] = useState(false);
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Open actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit Activity
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowNextActionDialog(true)}>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                <span className="text-nowrap">Manage Next Action</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 hover:!text-red-600 focus:!text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Activity
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {showEditDialog && (
            <EditActivityDialog
              key={`edit-${activity.id}-${showEditDialog}`}
              activity={activity}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}
          {showDeleteDialog && (
            <DeleteActivityDialog
              key={`delete-${activity.id}-${showDeleteDialog}`}
              activity={activity}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />
          )}
          {showNextActionDialog && (
            <EditNextActionDialog
              key={`next-action-${activity.id}-${showNextActionDialog}`}
              activity={activity}
              open={showNextActionDialog}
              onOpenChange={setShowNextActionDialog}
            />
          )}
        </div>
      );
    },
  },
];
