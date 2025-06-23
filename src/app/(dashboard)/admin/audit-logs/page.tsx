import { AuditLogsTable } from "@/components/admin/audit-logs/audit-logs-table";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DashboardHeader } from "@/components/layout/dashboard-header";

export default async function AuditLogsPage() {
  const session = await auth();

  if (!session?.user || !["SYS_ADMIN"].includes(session.user.role)) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Audit Logs" user={session.user} />
      <AuditLogsTable />
    </DashboardShell>
  );
}
