import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  Prisma,
  ProspectStatus,
  Priority,
  DoctorType,
  ProspectType,
  OrderOpportunity,
  PrescriptionVolume,
  AuditEntityType,
  AuditActionType,
} from "@prisma/client";
import * as z from "zod";
import { logAudit } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";

const createProspectSchema = z.object({
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

    const status = searchParams.get("status") as ProspectStatus | null;
    const priority = searchParams.get("priority") as Priority | null;
    const doctorType = searchParams.get("doctorType") as DoctorType | null;
    const prospectTypeParam = searchParams.get(
      "prospectType"
    ) as ProspectType | null;
    const orderOpportunity = searchParams.get(
      "orderOpportunity"
    ) as OrderOpportunity | null;

    const isAdmin = ["ADMIN", "SYS_ADMIN"].includes(session.user.role);
    const where: Prisma.ProspectWhereInput = isAdmin
      ? {}
      : { userId: session.user.id };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { company: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { specialization: { contains: search, mode: "insensitive" } },

        { address: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status && Object.values(ProspectStatus).includes(status))
      where.status = status;
    if (priority && Object.values(Priority).includes(priority))
      where.priority = priority;
    if (doctorType && Object.values(DoctorType).includes(doctorType))
      where.doctorType = doctorType;
    if (
      prospectTypeParam &&
      Object.values(ProspectType).includes(prospectTypeParam)
    )
      where.prospectType = prospectTypeParam;
    if (
      orderOpportunity &&
      Object.values(OrderOpportunity).includes(orderOpportunity)
    )
      where.orderOpportunity = orderOpportunity;

    const [prospects, total] = await prisma.$transaction([
      prisma.prospect.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, avatar: true } },
          activities: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.prospect.count({ where }),
    ]);

    return NextResponse.json({
      prospects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching prospects:", error);
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

    const validation = createProspectSchema.safeParse(body);
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

    const prospectData: Prisma.ProspectCreateInput = {
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
      company: validatedData.company,
      position: validatedData.position,
      address: validatedData.address,
      status: validatedData.status,
      priority: validatedData.priority,
      source: validatedData.source,
      notes: validatedData.notes,

      prospectType: validatedData.prospectType as ProspectType,

      orderOpportunity: validatedData.orderOpportunity,
      orderValue: validatedData.orderValue,

      doctorType: validatedData.doctorType,
      specialization: validatedData.specialization,
      prescriptionVolume: validatedData.prescriptionVolume,

      user: { connect: { id: session.user.id } },
    };

    const prospect = await prisma.prospect.create({
      data: prospectData,
      include: {
        user: { select: { id: true, name: true, email: true, avatar: true } },
      },
    });

    const { ipAddress, userAgent } = await getRequestClientInfo();

    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.CREATE,
      entityType: AuditEntityType.PROSPECT,
      entityId: prospect.id,
      details: { createdData: prospect },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(prospect, { status: 201 });
  } catch (error) {
    console.error("Error creating prospect:", error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.PROSPECT,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "CREATE_PROSPECT",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            error:
              "A prospect with similar unique details (e.g., email or phone) might already exist.",
          },
          { status: 409 }
        );
      }
    }
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
