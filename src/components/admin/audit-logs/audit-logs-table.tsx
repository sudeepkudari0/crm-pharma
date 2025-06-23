"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { DataTableWithManualPagination } from "@/components/ui/data-table-with-manual-pagination";
import { auditLogsColumns } from "./columns";
import type { AuditLogWithUser } from "@/types";
import {
  AuditActionType,
  AuditEntityType,
  User as PrismaUser,
} from "@prisma/client";
import { DateRange } from "react-day-picker";
import dayjs from "dayjs";
import { toast } from "sonner";

const createQueryString = (
  params: Record<string, string | number | undefined | null>
): string => {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && String(value).trim() !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

export function AuditLogsTable() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [auditLogs, setAuditLogs] = useState<AuditLogWithUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pagination, setPagination] = useState({
    pageIndex: Number(searchParams.get("page") || "1") - 1,
    pageSize: Number(searchParams.get("limit") || "20"),
  });
  const [userIdFilter, setUserIdFilter] = useState(
    searchParams.get("userId") || ""
  );
  const [actionTypeFilter, setActionTypeFilter] = useState<string | null>(
    searchParams.get("actionType") || null
  );
  const [entityTypeFilter, setEntityTypeFilter] = useState<string | null>(
    searchParams.get("entityType") || null
  );
  const [entityIdFilter, setEntityIdFilter] = useState(
    searchParams.get("entityId") || ""
  );
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRange | undefined>(
    () => {
      const from = searchParams.get("dateFrom");
      const to = searchParams.get("dateTo");
      if (from && to) return { from: new Date(from), to: new Date(to) };
      return undefined;
    }
  );

  const [usersForFilter, setUsersForFilter] = useState<
    Pick<PrismaUser, "id" | "name">[]
  >([]);

  const [debouncedEntityId, setDebouncedEntityId] = useState(entityIdFilter);
  const [debouncedUserId, setDebouncedUserId] = useState(userIdFilter);

  useEffect(() => {
    const handler = setTimeout(() => setEntityIdFilter(debouncedEntityId), 500);
    return () => clearTimeout(handler);
  }, [debouncedEntityId]);

  useEffect(() => {
    const handler = setTimeout(() => setUserIdFilter(debouncedUserId), 500);
    return () => clearTimeout(handler);
  }, [debouncedUserId]);

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    const params = {
      page: pagination.pageIndex + 1,
      limit: pagination.pageSize,
      userId: userIdFilter || undefined,
      actionType: actionTypeFilter === "ALL" ? undefined : actionTypeFilter,
      entityType: entityTypeFilter === "ALL" ? undefined : entityTypeFilter,
      entityId: entityIdFilter || undefined,
      dateFrom: dateRangeFilter?.from
        ? dayjs(dateRangeFilter.from).startOf("day").toISOString()
        : undefined,
      dateTo: dateRangeFilter?.to
        ? dayjs(dateRangeFilter.to).endOf("day").toISOString()
        : undefined,
    };
    const queryString = createQueryString(params);
    router.push(`${pathname}?${queryString}`, { scroll: false });

    try {
      const response = await fetch(`/api/admin/audit-logs?${queryString}`);
      if (!response.ok) throw new Error("Failed to fetch audit logs");
      const data = await response.json();
      setAuditLogs(data.auditLogs || []);
      setTotalCount(data.pagination?.total || 0);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast.error("Could not load audit logs.");
      setAuditLogs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [
    pagination,
    userIdFilter,
    actionTypeFilter,
    entityTypeFilter,
    entityIdFilter,
    dateRangeFilter,
    router,
    pathname,
  ]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  useEffect(() => {
    const fetchUsersForFilter = async () => {
      try {
        const res = await fetch("/api/admin/users?limit=1000");
        if (res.ok) {
          const data = await res.json();
          setUsersForFilter(
            data.users.map((u: any) => ({ id: u.id, name: u.name }))
          );
        }
      } catch (e) {
        console.error("Failed to fetch users for filter", e);
      }
    };
    fetchUsersForFilter();
  }, []);

  return (
    <Card>
      <CardHeader className="flex md:hidden flex-row justify-between items-center gap-4">
        <CardTitle>System Audit Logs</CardTitle>
      </CardHeader>
      <CardContent className="pt-0 md:pt-4">
        <div className="mb-6 p-4 border rounded-lg space-y-4">
          <p className="font-medium text-sm">Filters</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Filter by User ID..."
              value={debouncedUserId}
              onChange={(e) => setDebouncedUserId(e.target.value)}
              className="h-9 text-xs"
            />
            <Select
              value={
                usersForFilter.find((u) => u.id === userIdFilter)?.id || ""
              }
              onValueChange={(val) =>
                setUserIdFilter(val === "ALL_USERS" ? "" : val)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Filter by User" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL_USERS">All Users</SelectItem>
                {usersForFilter.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={actionTypeFilter || "ALL"}
              onValueChange={(val) =>
                setActionTypeFilter(val === "ALL" ? null : val)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Action Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                {Object.values(AuditActionType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={entityTypeFilter || "ALL"}
              onValueChange={(val) =>
                setEntityTypeFilter(val === "ALL" ? null : val)
              }
            >
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Entities</SelectItem>
                {Object.values(AuditEntityType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type
                      .replace(/_/g, " ")
                      .toLowerCase()
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filter by Entity ID..."
              value={debouncedEntityId}
              onChange={(e) => setDebouncedEntityId(e.target.value)}
              className="h-9 text-xs"
            />
            <DateRangePicker
              className="h-9 text-xs"
              date={dateRangeFilter}
              onDateChange={setDateRangeFilter}
              placeholder="Filter by Date Range"
            />
          </div>
        </div>

        <DataTableWithManualPagination
          data={auditLogs}
          columns={auditLogsColumns}
          totalCount={totalCount}
          pagination={pagination}
          onPaginationChange={setPagination}
        />
      </CardContent>
    </Card>
  );
}
