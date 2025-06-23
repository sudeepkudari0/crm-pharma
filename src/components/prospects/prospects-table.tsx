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
import { prospectsColumns } from "./columns";
import type { ProspectWithRelations, User } from "@/types";
import { CreateProspectDialog } from "./create-prospect-dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";

enum ProspectStatus {
  LEAD = "LEAD",
  QUALIFIED = "QUALIFIED",
  PROPOSAL = "PROPOSAL",
  NEGOTIATION = "NEGOTIATION",
  CLOSED_WON = "CLOSED_WON",
  CLOSED_LOST = "CLOSED_LOST",
}
enum Priority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  URGENT = "URGENT",
}

interface ProspectsTableProps {
  prospects: ProspectWithRelations[];
}

export function ProspectsTable({ prospects }: ProspectsTableProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);
  const [creatorUserFilter, setCreatorUserFilter] = useState<string | null>(
    null
  );

  const uniqueCreatorUsers = useMemo(() => {
    const usersMap = new Map<string, User>();
    prospects.forEach((prospect) => {
      if (
        prospect.user &&
        prospect.user.id &&
        !usersMap.has(prospect.user.id)
      ) {
        usersMap.set(prospect.user.id, prospect.user);
      }
    });
    return Array.from(usersMap.values()).sort((a, b) =>
      (a.name || "").localeCompare(b.name || "")
    );
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    return prospects.filter((prospect) => {
      if (
        statusFilter &&
        statusFilter !== "ALL" &&
        prospect.status !== statusFilter
      ) {
        return false;
      }
      if (
        priorityFilter &&
        priorityFilter !== "ALL" &&
        prospect.priority !== priorityFilter
      ) {
        return false;
      }
      if (
        creatorUserFilter &&
        creatorUserFilter !== "ALL" &&
        prospect.userId !== creatorUserFilter
      ) {
        return false;
      }
      return true;
    });
  }, [prospects, statusFilter, priorityFilter, creatorUserFilter]);

  const currentVisibleProspects = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return filteredProspects.slice(start, end);
  }, [filteredProspects, pagination]);

  const handleFilterChange =
    (setter: React.Dispatch<React.SetStateAction<string | null>>) =>
    (value: string) => {
      setter(value === "ALL" ? null : value);
      setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    };

  return (
    <Card className="">
      <CreateProspectDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
      />
      <CardHeader className="flex md:hidden flex-row justify-between items-center gap-4">
        <div className="flex flex-col">
          <CardTitle>Prospects</CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="text-xs h-8 w-[120px] md:w-[150px]"
          >
            <Plus className="h-4 w-4" />
            Add Prospect
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 md:pt-4  ">
        <DataTableWithManualPagination
          data={currentVisibleProspects}
          totalCount={filteredProspects.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          columns={prospectsColumns}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter || "ALL"}
                onValueChange={handleFilterChange(setStatusFilter)}
              >
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  {Object.values(ProspectStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={priorityFilter || "ALL"}
                onValueChange={handleFilterChange(setPriorityFilter)}
              >
                <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  {Object.values(Priority).map((priority) => (
                    <SelectItem key={priority} value={priority}>
                      {priority}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={creatorUserFilter || "ALL"}
                onValueChange={handleFilterChange(setCreatorUserFilter)}
                disabled={uniqueCreatorUsers.length === 0}
              >
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                  <SelectValue placeholder="Created By User" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Created By (All)</SelectItem>
                  {uniqueCreatorUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name || `User ID: ${user.id.substring(0, 6)}...`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="text-xs h-8 w-[120px] md:w-[150px]"
                >
                  <Plus className="h-4 w-4" />
                  Add Prospect
                </Button>
              </div>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
