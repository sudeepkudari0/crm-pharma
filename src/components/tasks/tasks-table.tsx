"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTableWithManualPagination } from "@/components/ui/data-table-with-manual-pagination";
import { tasksColumns } from "./columns";
import type { TaskWithRelations } from "@/types";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateTaskDialog } from "./create-task-dialog";

interface TasksTableProps {
  tasks: TaskWithRelations[];
}

export function TasksTable({ tasks }: TasksTableProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter((task) => {
    if (
      statusFilter &&
      statusFilter !== "ALL" &&
      task.status !== statusFilter
    ) {
      return false;
    }
    if (
      priorityFilter &&
      priorityFilter !== "ALL" &&
      task.priority !== priorityFilter
    ) {
      return false;
    }
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex md:hidden flex-row justify-between items-center gap-4">
        <CardTitle>All Tasks</CardTitle>

        <div className="flex items-center space-x-2">
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="text-xs h-8 w-[120px] md:w-[150px]"
          >
            <Plus className="h-4 w-4" />
            Create Task
          </Button>
        </div>
        <CreateTaskDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </CardHeader>
      <CardContent className="pt-0 md:pt-4">
        <DataTableWithManualPagination
          data={filteredTasks}
          totalCount={filteredTasks.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          columns={tasksColumns}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={statusFilter || "ALL"}
                onValueChange={(value) =>
                  setStatusFilter(value === "ALL" ? null : value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={priorityFilter || "ALL"}
                onValueChange={(value) =>
                  setPriorityFilter(value === "ALL" ? null : value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Priority</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="text-xs h-8 w-[120px] md:w-[150px]"
                >
                  <Plus className="h-4 w-4" />
                  Create Task
                </Button>
              </div>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
