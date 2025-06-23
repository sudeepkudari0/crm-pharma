import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  AuditActionType,
  AuditEntityType,
  Prisma,
} from "@prisma/client";
import * as z from "zod";
import { logAudit } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";

const updateActivitySchema = z
  .object({
    type: z.nativeEnum(ActivityType).optional(),
    subject: z
      .string()
      .min(2, "Subject must be at least 2 characters.")
      .optional(),
    description: z.string().optional().nullable(),
    duration: z
      .number()
      .positive("Duration must be a positive number.")
      .optional()
      .nullable(),
    outcome: z.string().optional().nullable(),

    nextActionType: z.string().optional().nullable(),
    nextActionDetails: z.string().optional().nullable(),
    nextActionDate: z
      .string()
      .datetime({
        offset: true,
        message:
          "Invalid date format for Next Action Date. Expected ISO 8601 string.",
      })
      .optional()
      .nullable(),

    prospectId: z
      .string()
      .min(1, "Prospect ID is required if provided.")
      .optional(),
    scheduledAt: z
      .string()
      .datetime({
        offset: true,
        message:
          "Invalid date format for Scheduled At. Expected ISO 8601 string.",
      })
      .optional()
      .nullable(),
    samplesProvided: z
      .array(
        z.object({
          productId: z.string().min(1, "Product ID in sample is required."),
          quantity: z.number().min(1, "Sample quantity must be at least 1."),
        })
      )
      .optional()
      .nullable(),
    orderDiscussed: z.boolean().optional(),
    orderAmount: z
      .number()
      .positive("Order amount must be a positive number.")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        (data.nextActionType !== undefined ||
          data.nextActionDetails !== undefined) &&
        (data.nextActionDate === undefined || data.nextActionDate === null)
      ) {
        if (data.nextActionType !== null || data.nextActionDetails !== null) {
          return false;
        }
      }
      return true;
    },
    {
      message:
        "Next Action Date is required if Next Action Type or Details are specified (and not being cleared).",
      path: ["nextActionDate"],
    }
  );

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: id },
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        prospect: true,
      },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && activity.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(activity);
  } catch (error) {
    console.error(`Error fetching activity:`, error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation = updateActivitySchema.safeParse(body);
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

    const existingActivity = await prisma.activity.findUnique({
      where: { id: id },
    });

    if (!existingActivity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && existingActivity.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this activity." },
        { status: 403 }
      );
    }

    if (
      validatedData.prospectId &&
      validatedData.prospectId !== existingActivity.prospectId
    ) {
      const prospect = await prisma.prospect.findUnique({
        where: { id: validatedData.prospectId },
      });
      if (!prospect) {
        return NextResponse.json(
          { error: "New prospect not found" },
          { status: 404 }
        );
      }
      if (!isAdmin && prospect.userId !== session.user.id) {
        return NextResponse.json(
          { error: "Forbidden. You do not own the new prospect." },
          { status: 403 }
        );
      }
    }

    const updateData: Prisma.ActivityUpdateInput = {};

    if (validatedData.type !== undefined) updateData.type = validatedData.type;
    if (validatedData.subject !== undefined)
      updateData.subject = validatedData.subject;
    if (validatedData.hasOwnProperty("description"))
      updateData.description = validatedData.description;
    if (validatedData.hasOwnProperty("duration"))
      updateData.duration = validatedData.duration;
    if (validatedData.hasOwnProperty("outcome"))
      updateData.outcome = validatedData.outcome;
    if (validatedData.hasOwnProperty("scheduledAt")) {
      updateData.scheduledAt = validatedData.scheduledAt
        ? new Date(validatedData.scheduledAt)
        : null;
    }
    if (validatedData.hasOwnProperty("orderAmount"))
      updateData.orderAmount = validatedData.orderAmount;
    if (validatedData.orderDiscussed !== undefined)
      updateData.orderDiscussed = validatedData.orderDiscussed;
    if (validatedData.prospectId !== undefined)
      updateData.prospect = { connect: { id: validatedData.prospectId } };

    if (validatedData.hasOwnProperty("samplesProvided")) {
      updateData.samplesProvided = validatedData.samplesProvided
        ? validatedData.samplesProvided
        : null;
    }

    let resetReminderFlag = false;

    if (validatedData.hasOwnProperty("nextActionType")) {
      updateData.nextActionType = validatedData.nextActionType;
      if (validatedData.nextActionType !== existingActivity.nextActionType)
        resetReminderFlag = true;
    }
    if (validatedData.hasOwnProperty("nextActionDetails")) {
      updateData.nextActionDetails = validatedData.nextActionDetails;
      if (
        validatedData.nextActionDetails !== existingActivity.nextActionDetails
      )
        resetReminderFlag = true;
    }
    if (validatedData.hasOwnProperty("nextActionDate")) {
      updateData.nextActionDate = validatedData.nextActionDate
        ? new Date(validatedData.nextActionDate)
        : null;

      const newDate = updateData.nextActionDate;
      const existingDate = existingActivity.nextActionDate;
      if (
        (newDate === null && existingDate !== null) ||
        (newDate !== null && existingDate === null) ||
        (newDate &&
          existingDate &&
          newDate.getTime() !== existingDate.getTime())
      ) {
        resetReminderFlag = true;
      }
    }

    if (
      resetReminderFlag ||
      (updateData.nextActionType === null &&
        updateData.nextActionDetails === null &&
        updateData.nextActionDate === null &&
        (existingActivity.nextActionType !== null ||
          existingActivity.nextActionDetails !== null ||
          existingActivity.nextActionDate !== null))
    ) {
      updateData.nextActionReminderSent = false;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update.", activity: existingActivity },
        { status: 200 }
      );
    }

    const updatedActivity = await prisma.activity.update({
      where: { id: id },
      data: updateData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        prospect: true,
      },
    });

    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    for (const key in validatedData) {
      if (
        validatedData.hasOwnProperty(key) &&
        existingActivity.hasOwnProperty(key)
      ) {
        const typedKey = key as keyof typeof existingActivity;
        if (
          JSON.stringify(existingActivity[typedKey]) !==
          JSON.stringify(validatedData[typedKey as keyof typeof validatedData])
        ) {
          changes[key] = {
            oldValue: existingActivity[typedKey],
            newValue: validatedData[typedKey as keyof typeof validatedData],
          };
        }
      }
    }

    if (Object.keys(changes).length > 0) {
      const { ipAddress, userAgent } = await getRequestClientInfo();
      logAudit({
        userId: session.user.id,
        userName: session.user.name || null,
        userRole: session.user.role,
        action: AuditActionType.UPDATE,
        entityType: AuditEntityType.ACTIVITY,
        entityId: updatedActivity.id,
        details: { changes },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json(updatedActivity);
  } catch (error) {
    console.error(`Error updating activity:`, error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.ACTIVITY,
      entityId: (await params).id,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "UPDATE_ACTIVITY",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error:
              "Record to update or a related record to connect was not found.",
          },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Activity ID is required" },
        { status: 400 }
      );
    }

    const activity = await prisma.activity.findUnique({
      where: { id: id },
    });

    if (!activity) {
      return NextResponse.json(
        { error: "Activity not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && activity.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.activity.delete({
      where: { id: id },
    });

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.DELETE,
      entityType: AuditEntityType.ACTIVITY,
      entityId: (await params).id,
      details: { deletedDataSnapshot: activity },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(
      { message: "Activity deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting activity:`, error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.ACTIVITY,
      entityId: (await params).id,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "DELETE_ACTIVITY",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Activity not found or already deleted." },
          { status: 404 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
