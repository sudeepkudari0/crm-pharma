import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  AuditActionType,
  AuditEntityType,
  UserRole,
} from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (
      !session?.user?.id ||
      !session.user.role ||
      ![UserRole.SYS_ADMIN, UserRole.ADMIN].includes(
        session.user.role as "SYS_ADMIN" | "ADMIN"
      )
    ) {
      return NextResponse.json(
        { error: "Forbidden: Access restricted to administrators." },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const searchUserId = searchParams.get("userId");
    const actionType = searchParams.get("actionType") as AuditActionType | null;
    const entityType = searchParams.get("entityType") as AuditEntityType | null;
    const entityId = searchParams.get("entityId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.AuditLogWhereInput = {
      user: {
        NOT: {
          role: UserRole.SYS_ADMIN,
        },
      },
    };

    if (searchUserId) {
      where.userId = searchUserId;
    }
    if (actionType && Object.values(AuditActionType).includes(actionType)) {
      where.action = actionType;
    }
    if (entityType && Object.values(AuditEntityType).includes(entityType)) {
      where.entityType = entityType;
    }
    if (entityId) {
      where.entityId = entityId;
    }
    if (dateFrom) {
      where.timestamp = { gte: new Date(dateFrom) };
    }
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      where.timestamp = { lte: endDate };
    }

    const [auditLogs, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      auditLogs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
