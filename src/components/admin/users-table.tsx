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
import { usersColumns } from "./columns";
import type { UserWithRelations } from "@/types";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";

interface UsersTableProps {
  users: UserWithRelations[];
  currentUserRole: string;
}

export function UsersTable({ users, currentUserRole }: UsersTableProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Filter users based on selected filters
  const filteredUsers = users.filter((user) => {
    if (roleFilter && roleFilter !== "ALL" && user.role !== roleFilter) {
      return false;
    }
    if (statusFilter && statusFilter !== "ALL") {
      const isActive = statusFilter === "ACTIVE";
      if (user.isActive !== isActive) {
        return false;
      }
    }
    return true;
  });

  return (
    <Card>
      <CardHeader className="flex md:hidden flex-row justify-between items-center gap-4">
        <CardTitle>All Users ({filteredUsers.length})</CardTitle>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>

        <CreateUserDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </CardHeader>
      <CardContent className="pt-0 md:pt-4">
        <DataTableWithManualPagination
          data={filteredUsers}
          totalCount={filteredUsers.length}
          pagination={pagination}
          onPaginationChange={setPagination}
          columns={usersColumns}
          actions={
            <div className="flex items-center gap-2">
              <Select
                value={roleFilter || "ALL"}
                onValueChange={(value) =>
                  setRoleFilter(value === "ALL" ? null : value)
                }
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Roles</SelectItem>
                  <SelectItem value="ASSOCIATE">Associates</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SYS_ADMIN">System Admin</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="INACTIVE">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <div className="hidden md:flex items-center space-x-2">
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>
          }
        />
      </CardContent>
    </Card>
  );
}
