"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  MoreHorizontal,
  Phone,
  Mail,
  Edit,
  Trash2,
  CalendarDays,
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
import { EditProspectDialog } from "./edit-prospect-dialog";
import { DeleteProspectDialog } from "./delete-prospect-dialog";
import type { ProspectWithRelations } from "@/types";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import dayjs from "dayjs";

const statusColors = {
  LEAD: "bg-blue-100 text-blue-800",
  QUALIFIED: "bg-green-100 text-green-800",
  PROPOSAL: "bg-yellow-100 text-yellow-800",
  NEGOTIATION: "bg-orange-100 text-orange-800",
  CLOSED_WON: "bg-emerald-100 text-emerald-800",
  CLOSED_LOST: "bg-red-100 text-red-800",
};

const priorityColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  URGENT: "bg-red-100 text-red-800",
};

const orderOpportunityColors = {
  NONE: "bg-gray-100 text-gray-800",
  LOW: "bg-yellow-100 text-yellow-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  CONFIRMED: "bg-green-100 text-green-800",
};

const prospectTypeColors: { [key: string]: string } = {
  DOCTOR_CLINIC: "bg-sky-100 text-sky-800",
  DOCTOR_HOSPITAL: "bg-blue-100 text-blue-800",
  PHARMACY: "bg-green-100 text-green-800",
  DIAGNOSTIC_LAB: "bg-indigo-100 text-indigo-800",
  DISTRIBUTOR: "bg-purple-100 text-purple-800",
  RETAILOR: "bg-pink-100 text-pink-800",
  MEDICAL_COLLEGE: "bg-teal-100 text-teal-800",
  INDIVIDUAL_BUYES: "bg-amber-100 text-amber-800",
  OTHER: "bg-slate-100 text-slate-800",
};

const prescriptionVolumeColors = {
  LOW: "bg-gray-100 text-gray-800",
  MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800",
  VERY_HIGH: "bg-red-100 text-red-800",
};

const formatEnumString = (str: string | null | undefined): string => {
  if (!str) return "N/A";
  return str.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
};

const ProductQuantityDisplay = ({
  items,
  icon: Icon,
  emptyText = "None",
  tooltipTitle,
}: {
  items: { productId: string; quantity: number }[] | null | undefined;
  icon: React.ElementType;
  emptyText?: string;
  tooltipTitle: string;
}) => {
  if (!items || items.length === 0) {
    return <span className="text-xs text-muted-foreground">{emptyText}</span>;
  }
  const displayCount = 1;
  const firstItems = items
    .slice(0, displayCount)
    .map((s) => `${s.productId} (x${s.quantity})`)
    .join(", ");
  const remainingCount = items.length - displayCount;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger className="text-left w-full">
          <div className="flex items-center text-xs text-nowrap">
            <Icon className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
            <span className="truncate max-w-[120px]">{firstItems}</span>
            {remainingCount > 0 && (
              <span className="ml-1 text-muted-foreground">
                (+{remainingCount})
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs" side="top">
          <p className="font-semibold mb-1">{tooltipTitle}:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            {items.map((s, i) => (
              <li key={i}>
                {s.productId} (Quantity: {s.quantity})
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export const prospectsColumns: ColumnDef<ProspectWithRelations>[] = [
  {
    accessorKey: "name",
    header: "Contact",
    minSize: 220,
    cell: ({ row }) => {
      const prospect = row.original;
      const initials =
        prospect.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "P";
      return (
        <div className="flex items-center space-x-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-sm font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p
              className="font-semibold text-sm text-gray-800 dark:text-gray-200 text-nowrap truncate max-w-[150px]"
              title={prospect.name}
            >
              {prospect.name}
            </p>
            {prospect.phone && (
              <div className="flex items-center text-xs text-muted-foreground text-nowrap">
                <Phone className="h-3 w-3 mr-1 flex-shrink-0" />
                {prospect.phone}
              </div>
            )}
            {prospect.email && (
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="flex items-center text-xs text-muted-foreground text-nowrap">
                      <Mail className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate max-w-[130px]">
                        {prospect.email}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{prospect.email}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "prospectType",
    header: () => <div className="flex items-center">Type</div>,
    size: 160,
    cell: ({ row }) => {
      const prospectType = row.original.prospectType;
      if (!prospectType)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      const colorClass =
        prospectTypeColors[prospectType] || prospectTypeColors.OTHER;
      return (
        <Badge
          variant="outline"
          className={`text-xs px-2 py-1 ${colorClass} border-transparent text-nowrap`}
        >
          {formatEnumString(prospectType)}
        </Badge>
      );
    },
  },

  {
    accessorKey: "company",
    header: "Organization",
    minSize: 180,
    cell: ({ row }) => {
      const { company, position } = row.original;
      return (
        <div className="text-xs">
          <p
            className="font-medium text-gray-700 dark:text-gray-300 text-nowrap truncate max-w-[150px]"
            title={company || ""}
          >
            {company || "N/A"}
          </p>
          {position && (
            <p
              className="text-muted-foreground text-nowrap truncate max-w-[150px]"
              title={position}
            >
              {position}
            </p>
          )}
        </div>
      );
    },
  },

  {
    id: "location",
    header: () => <div className="flex items-center">Location</div>,
    minSize: 150,
    cell: ({ row }) => {
      const { address } = row.original;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger>
              <span
                className="text-xs text-muted-foreground text-nowrap truncate max-w-[120px]"
                title={address || ""}
              >
                {address || "N/A"}
              </span>
            </TooltipTrigger>
            {address && <TooltipContent>{address}</TooltipContent>}
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "doctorDetails",
    header: "Doctor Details",
    minSize: 200,
    cell: ({ row }) => {
      const { doctorType, specialization } = row.original;
      if (!doctorType && !specialization)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      return (
        <div className="flex flex-col items-center text-xs space-y-0.5">
          {doctorType && (
            <Badge variant="outline" className="w-fit text-nowrap">
              {formatEnumString(doctorType)}
            </Badge>
          )}
          {specialization && (
            <span
              className="text-blue-600 pt-1 dark:text-blue-400 truncate max-w-[160px]"
              title={specialization}
            >
              {specialization}
            </span>
          )}
        </div>
      );
    },
  },

  {
    id: "statusAndPriority",
    header: "Status / Priority",
    minSize: 180,
    cell: ({ row }) => {
      const { status, priority } = row.original;
      return (
        <div className="flex flex-col space-y-1 text-xs">
          <Badge
            variant="secondary"
            className={`${
              statusColors[status] || statusColors.LEAD
            } text-nowrap w-fit`}
          >
            {formatEnumString(status)}
          </Badge>
          <Badge
            variant="secondary"
            className={`${
              priorityColors[priority] || priorityColors.MEDIUM
            } text-nowrap w-fit`}
          >
            {priority} Priority
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "notes",
    header: () => <div className="flex items-center">Notes</div>,
    minSize: 150,
    cell: ({ row }) => {
      const notes = row.original.notes;
      if (!notes)
        return <span className="text-xs text-muted-foreground">N/A</span>;
      return (
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger className="text-left">
              <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                {notes}
              </p>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm bg-background text-foreground border shadow-lg p-2.5">
              <p className="text-xs whitespace-pre-wrap">{notes}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    },
  },

  {
    id: "datesAndUser",
    header: "Timestamps & User",
    minSize: 200,
    cell: ({ row }) => {
      const { lastContact, nextFollowUp, createdAt, user } = row.original;
      return (
        <div className="text-xs space-y-1">
          {lastContact && (
            <div>
              <CalendarDays className="inline h-3 w-3 mr-1 text-muted-foreground" />
              LC: {dayjs(lastContact).format("MMM D, YY")}
            </div>
          )}
          {nextFollowUp && (
            <div className="font-medium text-blue-600">
              <CalendarDays className="inline h-3 w-3 mr-1" />
              NFU: {dayjs(nextFollowUp).format("MMM D, YY")}
            </div>
          )}
          <div>
            <span
              className="truncate max-w-[80px] inline-block align-middle"
              title={user?.name || ""}
            >
              {user?.name || "N/A"}
            </span>
          </div>
          <div className="text-muted-foreground">
            Added: {dayjs(createdAt).format("MMM D, YYYY")}
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
      const prospect = row.original;

      const [showEditDialog, setShowEditDialog] = useState(false);

      const [showDeleteDialog, setShowDeleteDialog] = useState(false);

      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowEditDialog(true)}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit Prospect
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 hover:!text-red-600 focus:!text-red-600"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete Prospect
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {showEditDialog && (
            <EditProspectDialog
              key={`edit-${prospect.id}-${showEditDialog}`}
              prospect={prospect}
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
            />
          )}
          {showDeleteDialog && (
            <DeleteProspectDialog
              key={`delete-${prospect.id}-${showDeleteDialog}`}
              prospect={prospect}
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
            />
          )}
        </div>
      );
    },
  },
];
