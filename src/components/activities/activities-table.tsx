"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableWithManualPagination } from "@/components/ui/data-table-with-manual-pagination";
import { activitiesColumns as baseActivitiesColumns } from "./columns";
import type { ActivityWithRelations, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateActivityDialog } from "./create-activity-dialog";
import { UserRole } from "@prisma/client";

interface ActivitiesTableProps {
  activities: ActivityWithRelations[];
  role: UserRole;
}

export function ActivitiesTable({ activities, role }: ActivitiesTableProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState<string | null>(null);

  const isAdmin = role === "ADMIN" || role === "SYS_ADMIN";

  const uniqueUsers = useMemo(() => {
    const usersMap = new Map<string, User>();
    activities.forEach((activity) => {
      if (
        activity.user &&
        activity.user.id &&
        !usersMap.has(activity.user.id)
      ) {
        usersMap.set(activity.user.id, activity.user);
      }
    });
    return Array.from(usersMap.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      if (typeFilter && typeFilter !== "ALL" && activity.type !== typeFilter) {
        return false;
      }
      if (
        userFilter &&
        userFilter !== "ALL" &&
        activity.userId !== userFilter
      ) {
        return false;
      }
      return true;
    });
  }, [activities, typeFilter, userFilter]);

  const currentVisibleActivities = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredActivities.slice(start, end);
  }, [filteredActivities, pagination]);

  const columns = useMemo(() => {
    if (isAdmin) {
      return baseActivitiesColumns; // Admins see all columns
    }
    // Non-admins don't see "Logged By"
    return baseActivitiesColumns.filter((column) => column.id !== "user.name");
  }, [role]);

  return (
    <Card>
      <CardHeader className="flex md:hidden flex-row justify-between items-center gap-4">
        <CardTitle>Activities</CardTitle>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="text-xs h-8 w-[120px] md:w-[150px]"
          >
            <Plus className="h-4 w-4" />
            Log Activity
          </Button>
        </div>
      </CardHeader>

      <CreateActivityDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />

      <CardContent className="pt-0 md:pt-4">
        <DataTableWithManualPagination
          data={currentVisibleActivities}
          totalCount={filteredActivities.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          columns={columns}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={typeFilter || "ALL"}
                onValueChange={(value) => {
                  setTypeFilter(value === "ALL" ? null : value);
                  setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="w-full sm:w-[160px] h-9 text-xs">
                  <SelectValue placeholder="Activity Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  <SelectItem value="CALL">Call</SelectItem>
                  <SelectItem value="EMAIL">Email</SelectItem>
                  <SelectItem value="MEETING">Meeting</SelectItem>
                  <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                  <SelectItem value="VISIT">Visit</SelectItem>
                  <SelectItem value="FOLLOW_UP">Follow Up</SelectItem>
                  <SelectItem value="PRESENTATION">Presentation</SelectItem>
                  <SelectItem value="SAMPLE_DROP">Sample Drop</SelectItem>
                  <SelectItem value="ORDER_COLLECTION">
                    Order Collection
                  </SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>

              {isAdmin && (
                <Select
                  value={userFilter || "ALL"}
                  onValueChange={(value) => {
                    setUserFilter(value === "ALL" ? null : value);
                    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                  }}
                  disabled={uniqueUsers.length === 0}
                >
                  <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                    <SelectValue placeholder="Logged By User" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Logged By (All)</SelectItem>
                    {uniqueUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || `User ID: ${user.id.substring(0, 6)}...`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="text-xs h-8 w-[120px] md:w-[150px]"
                >
                  <Plus className="h-4 w-4" />
                  Log Activity
                </Button>
              </div>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
