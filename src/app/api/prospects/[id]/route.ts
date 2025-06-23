import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import {
  DoctorType,
  OrderOpportunity,
  ProspectStatus,
  ProspectType,
  PrescriptionVolume,
  Priority,
  AuditEntityType,
  AuditActionType,
} from "@prisma/client";
import { logAudit } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";

const updateProspectSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z
    .string()
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal(""))
    .nullable(),
  phone: z
    .string()
    .min(10, { message: "Phone number must be at least 10 digits." }),
  company: z.string().optional().nullable(),
  position: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.nativeEnum(ProspectStatus).default(ProspectStatus.LEAD),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  source: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),

  prospectType: z.nativeEnum(ProspectType).optional().nullable(),

  orderOpportunity: z
    .nativeEnum(OrderOpportunity)
    .default(OrderOpportunity.NONE)
    .optional(),
  orderValue: z
    .number()
    .positive("Order value must be positive.")
    .optional()
    .nullable(),
  doctorType: z.nativeEnum(DoctorType).optional().nullable(),
  specialization: z.string().optional().nullable(),
  prescriptionVolume: z
    .nativeEnum(PrescriptionVolume)
    .default(PrescriptionVolume.LOW)
    .optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prospect = await prisma.prospect.findUnique({
      where: { id: (await params).id },
      include: {
        user: true,
        activities: {
          orderBy: { createdAt: "desc" },
        },
        tasks: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && prospect.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("Error fetching prospect:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = updateProspectSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const existingProspect = await prisma.prospect.findUnique({
      where: { id: (await params).id },
    });

    if (!existingProspect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && existingProspect.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (
      body.doctorType &&
      !Object.values(DoctorType).includes(body.doctorType)
    ) {
      return NextResponse.json(
        { error: "Invalid doctor type" },
        { status: 400 }
      );
    }

    if (
      body.orderOpportunity &&
      !Object.values(OrderOpportunity).includes(body.orderOpportunity)
    ) {
      return NextResponse.json(
        { error: "Invalid order opportunity" },
        { status: 400 }
      );
    }

    if (
      body.prescriptionVolume &&
      !Object.values(PrescriptionVolume).includes(body.prescriptionVolume)
    ) {
      return NextResponse.json(
        { error: "Invalid prescription volume" },
        { status: 400 }
      );
    }

    const updateData = {
      ...validation.data,
      orderValue: validation.data.orderValue
        ? Number.parseFloat(validation.data.orderValue.toString())
        : null,
      prospectType: validation.data.prospectType || undefined,
    };

    const prospect = await prisma.prospect.update({
      where: { id: (await params).id },
      data: updateData,
      include: {
        user: true,
      },
    });

    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    for (const key in updateData) {
      if (
        updateData.hasOwnProperty(key) &&
        existingProspect.hasOwnProperty(key)
      ) {
        const typedKey = key as keyof typeof existingProspect;
        if (
          JSON.stringify(existingProspect[typedKey]) !==
          JSON.stringify(updateData[typedKey as keyof typeof updateData])
        ) {
          changes[key] = {
            oldValue: existingProspect[typedKey],
            newValue: updateData[typedKey as keyof typeof updateData],
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
        entityType: AuditEntityType.PROSPECT,
        entityId: prospect.id,
        details: { changes },
        ipAddress,
        userAgent,
      });
    }

    return NextResponse.json(prospect);
  } catch (error) {
    console.error("Error updating prospect:", error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.PROSPECT,
      entityId: (await params).id,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "UPDATE_PROSPECT",
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if prospect exists and user has access
    const existingProspect = await prisma.prospect.findUnique({
      where: { id: (await params).id },
    });

    if (!existingProspect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && existingProspect.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.prospect.delete({
      where: { id: (await params).id },
    });

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.DELETE,
      entityType: AuditEntityType.PROSPECT,
      entityId: (await params).id,
      details: { deletedDataSnapshot: existingProspect },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Prospect deleted successfully" });
  } catch (error) {
    console.error("Error deleting prospect:", error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.PROSPECT,
      entityId: (await params).id,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "DELETE_PROSPECT",
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
