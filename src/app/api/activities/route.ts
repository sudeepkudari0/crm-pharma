import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  ActivityType,
  AuditActionType,
  AuditEntityType,
  Prisma,
} from "@prisma/client";
import { z } from "zod";
import { logAudit } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";

const createActivitySchema = z
  .object({
    type: z.nativeEnum(ActivityType),
    subject: z.string().min(2, "Subject must be at least 2 characters."),
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

    prospectId: z.string().min(1, "Prospect ID is required."),
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
    orderDiscussed: z.boolean().optional().default(false),
    orderAmount: z
      .number()
      .positive("Order amount must be a positive number.")
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (
        (data.nextActionType || data.nextActionDetails) &&
        !data.nextActionDate
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Next Action Date is required if Next Action Type or Details are specified.",
      path: ["nextActionDate"],
    }
  );

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") as ActivityType | null;
    const prospectId = searchParams.get("prospectId");

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);

    const where: Prisma.ActivityWhereInput = isAdmin
      ? {}
      : { userId: session.user.id };

    if (search) {
      where.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { prospect: { name: { contains: search, mode: "insensitive" } } },
        { prospect: { company: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (type && Object.values(ActivityType).includes(type)) {
      where.type = type;
    }

    if (prospectId) {
      where.prospectId = prospectId;
    }

    const [activities, total] = await prisma.$transaction([
      prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          prospect: true,
        },
        orderBy: { scheduledAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.activity.count({ where }),
    ]);

    return NextResponse.json({
      activities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = createActivitySchema.safeParse(body);
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

    const prospect = await prisma.prospect.findUnique({
      where: { id: validatedData.prospectId },
    });

    if (!prospect) {
      return NextResponse.json(
        { error: "Prospect not found" },
        { status: 404 }
      );
    }

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    if (!isAdmin && prospect.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden. You do not own this prospect." },
        { status: 403 }
      );
    }

    const activityData: Prisma.ActivityCreateInput = {
      type: validatedData.type,
      subject: validatedData.subject,
      description: validatedData.description,
      duration: validatedData.duration,
      outcome: validatedData.outcome,

      nextActionType: validatedData.nextActionType,
      nextActionDetails: validatedData.nextActionDetails,
      nextActionDate: validatedData.nextActionDate
        ? new Date(validatedData.nextActionDate)
        : null,
      nextActionReminderSent: false,

      scheduledAt: validatedData.scheduledAt
        ? new Date(validatedData.scheduledAt)
        : null,
      samplesProvided: validatedData.samplesProvided
        ? validatedData.samplesProvided
        : null,
      orderDiscussed: validatedData.orderDiscussed,
      orderAmount: validatedData.orderAmount,
      user: { connect: { id: session.user.id } },
      prospect: { connect: { id: validatedData.prospectId } },
    };

    const activity = await prisma.activity.create({
      data: activityData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
        prospect: true,
      },
    });

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.CREATE,
      entityType: AuditEntityType.ACTIVITY,
      entityId: activity.id,
      details: { createdData: validatedData },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.ACTIVITY,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "CREATE_ACTIVITY",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "A unique field constraint was violated (e.g., duplicate entry).",
          },
          { status: 409 }
        );
      }
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Related record (e.g., prospect or user) not found." },
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
