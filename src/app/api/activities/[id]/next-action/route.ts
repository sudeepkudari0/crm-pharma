import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { logAudit, AuditActionType, AuditEntityType } from "@/lib/audit-logger";
import { NextActionStatus, Prisma, UserRole } from "@prisma/client";
import * as z from "zod";
import { getRequestClientInfo } from "@/lib/server-util";

const updateNextActionSchema = z.object({
  nextActionType: z.string().optional().nullable(),
  nextActionDetails: z.string().optional().nullable(),
  nextActionDate: z.string().datetime().optional().nullable(),
  nextActionStatus: z.nativeEnum(NextActionStatus).optional(),
  nextActionCompletedAt: z.string().datetime().optional().nullable(),
  nextActionReminderSent: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let userIdForAudit: string | undefined = undefined;
  const { id } = await params;

  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userIdForAudit = session.user.id;

    const existingActivity = await prisma.activity.findUnique({
      where: { id },
    });
    if (!existingActivity) {
      return NextResponse.json(
        { error: "Parent activity not found" },
        { status: 404 }
      );
    }

    const isAdmin = [UserRole.ADMIN, UserRole.SYS_ADMIN].includes(
      session.user.role as "ADMIN" | "SYS_ADMIN"
    );
    if (!isAdmin && existingActivity.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateNextActionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const validatedData = validation.data;

    const dataToUpdate: Prisma.ActivityUpdateInput = {};
    const changes: Record<string, { oldValue: any; newValue: any }> = {};

    (Object.keys(validatedData) as Array<keyof typeof validatedData>).forEach(
      (key) => {
        if (validatedData[key] !== undefined) {
          const existingValue = existingActivity[key];
          const newValue = validatedData[key];

          if (key === "nextActionDate" || key === "nextActionCompletedAt") {
            (dataToUpdate as any)[key] = newValue
              ? new Date(newValue as string)
              : null;
          } else if (
            key === "nextActionType" ||
            key === "nextActionDetails" ||
            key === "nextActionStatus" ||
            key === "nextActionReminderSent"
          ) {
            (dataToUpdate as any)[key] = newValue;
          }

          if (
            JSON.stringify(existingValue) !== JSON.stringify(dataToUpdate[key])
          ) {
            changes[key] = {
              oldValue: existingValue,
              newValue: dataToUpdate[key],
            };
          }
        }
      }
    );

    if (validatedData.hasOwnProperty("nextActionDate")) {
      const newDate = validatedData.nextActionDate
        ? new Date(validatedData.nextActionDate)
        : null;
      if (
        newDate?.toISOString() !==
        existingActivity.nextActionDate?.toISOString()
      ) {
        dataToUpdate.nextActionReminderSent = false;
        if (
          JSON.stringify(changes["nextActionReminderSent"]?.newValue) !==
          "false"
        ) {
          changes["nextActionReminderSent"] = {
            oldValue: existingActivity.nextActionReminderSent,
            newValue: false,
          };
        }
      }
    }

    if (
      validatedData.nextActionStatus &&
      (validatedData.nextActionStatus === NextActionStatus.PENDING ||
        validatedData.nextActionStatus === NextActionStatus.RESCHEDULED) &&
      existingActivity.nextActionReminderSent === true
    ) {
      dataToUpdate.nextActionReminderSent = false;
      if (
        JSON.stringify(changes["nextActionReminderSent"]?.newValue) !== "false"
      ) {
        changes["nextActionReminderSent"] = {
          oldValue: existingActivity.nextActionReminderSent,
          newValue: false,
        };
      }
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return NextResponse.json(
        { message: "No changes to update for next action." },
        { status: 200 }
      );
    }

    const updatedActivity = await prisma.activity.update({
      where: { id },
      data: dataToUpdate,
    });

    if (Object.keys(changes).length > 0) {
      const { ipAddress, userAgent } = await getRequestClientInfo();
      logAudit({
        userId: session.user.id,
        userName: session.user.name,
        userRole: session.user.role,
        action: AuditActionType.UPDATE,
        entityType: AuditEntityType.ACTIVITY,
        entityId: id,
        details: { targetComponent: "nextAction", changes },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error(`Error updating next action for activity ${id}:`, error);
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.ACTIVITY,
      entityId: id,
      userId: userIdForAudit,
      details: {
        target: "next-action",
        error: error instanceof Error ? error.message : String(error),
        operation: "UPDATE_NEXT_ACTION_FAILED",
      },
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
