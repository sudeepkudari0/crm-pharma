import type {
  User,
  Prospect,
  Activity,
  Task,
  UserRole,
  ProspectStatus,
  ActivityType,
  TaskStatus,
  Priority,
  UserAdminAccess,
  AuditLog,
} from "@prisma/client";

export type {
  User,
  Prospect,
  Activity,
  Task,
  UserRole,
  ProspectStatus,
  ActivityType,
  TaskStatus,
  Priority,
};

export interface UserWithRelations extends User {
  adminAccess: UserAdminAccess[];
  userAccess: UserAdminAccess[];
}

export interface ProspectWithRelations extends Prospect {
  user: User;
  activities: Activity[];
  tasks: Task[];
}

export interface ActivityWithRelations extends Activity {
  user: User;
  prospect: Prospect;
}

export interface TaskWithRelations extends Task {
  createdBy: UserWithRelations;
  assignedTo?: UserWithRelations;
  prospect?: ProspectWithRelations;
}

export interface DashboardStats {
  totalProspects: number;
  activeProspects: number;
  completedActivities: number;
  pendingTasks: number;
  conversionRate: number;
  monthlyGrowth: number;
}

export const quickNextActions = [
  {
    label: "Follow-up Call in 1 Day",
    type: "CALL_PROSPECT",
    details: "Follow-up call",
    daysOffset: 1,
  },
  {
    label: "Follow-up WhatsApp in 3 Days",
    type: "WHATSAPP_PROSPECT",
    details: "Follow-up WhatsApp",
    daysOffset: 3,
  },
  {
    label: "Meeting Next Week",
    type: "SCHEDULE_MEETING",
    details: "Schedule meeting",
    daysOffset: 7,
  },
  {
    label: "Self Reminder Next Week",
    type: "WHATSAPP_SELF",
    details: "General self-reminder",
    daysOffset: 7,
  },
];

export const nextActionTypes = [
  { value: "CALL_PROSPECT", label: "Call Prospect" },
  { value: "EMAIL_PROSPECT", label: "Email Prospect" },
  { value: "SCHEDULE_MEETING", label: "Schedule Meeting" },
  { value: "SEND_SAMPLES", label: "Send Samples" },
  { value: "WHATSAPP_PROSPECT", label: "WhatsApp Reminder (Prospect)" },
  { value: "WHATSAPP_SELF", label: "WhatsApp Reminder (Self)" },
  { value: "CUSTOM_TASK", label: "Custom Task" },
];

export interface AuditLogWithUser extends AuditLog {
  user: {
    id: string;
    name: string | null;
    email: string | null;
    avatar: string | null;
    role: string | null;
  } | null;
}
