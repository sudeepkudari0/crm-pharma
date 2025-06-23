import { prisma } from "@/lib/prisma";
import { AuditActionType, AuditEntityType } from "@prisma/client";

export { AuditActionType, AuditEntityType };

export interface AuditLogPayload {
  action: AuditActionType;
  userId?: string | null;
  userName?: string | null;
  userRole?: string | null;
  entityType?: AuditEntityType | null;
  entityId?: string | null;
  targetUserId?: string | null;
  details?: any;
  ipAddress?: string | null;
  userAgent?: string | null;
  timestamp?: Date;
}

export function logAudit(payload: AuditLogPayload): void {
  const detailsToStore = payload.details
    ? JSON.parse(JSON.stringify(payload.details))
    : null;

  prisma.auditLog
    .create({
      data: {
        userId: payload.userId || undefined,
        userName: payload.userName,
        userRole: payload.userRole,
        action: payload.action,
        entityType: payload.entityType || undefined,
        entityId: payload.entityId,
        targetUserId: payload.targetUserId,
        details: detailsToStore,
        ipAddress: payload.ipAddress,
        userAgent: payload.userAgent,
        timestamp: payload.timestamp || new Date(),
      },
    })
    .then(() => {})
    .catch((error) => {
      console.error(
        "AUDIT LOGGING FAILED (async):",
        error,
        "Payload:",
        payload
      );
    });
}
