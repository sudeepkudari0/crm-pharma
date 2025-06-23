import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  Prisma,
  TaskStatus,
  Priority,
  TaskType,
  UserRole,
  AuditEntityType,
  AuditActionType,
} from "@prisma/client";
import * as z from "zod";
import { logAudit } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";

const createTaskApiSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters." }),
  description: z.string().optional().nullable(),
  priority: z.nativeEnum(Priority).default(Priority.MEDIUM),
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Invalid date format for Due Date." })
    .optional()
    .nullable(),
  assignedToId: z.string().optional().nullable(),
  prospectId: z.string().optional().nullable(),
  type: z.nativeEnum(TaskType),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const search = searchParams.get("search") || "";

    const statusParam = searchParams.get("status") as TaskStatus | null;
    const priorityParam = searchParams.get("priority") as Priority | null;
    const taskTypeParam = searchParams.get("type") as TaskType | null;
    const assignedToIdParam = searchParams.get("assignedToId");
    const createdByIdParam = searchParams.get("createdById");
    const prospectIdParam = searchParams.get("prospectId");

    const isAdmin = [UserRole.SYS_ADMIN].includes(
      session.user.role as "SYS_ADMIN"
    );

    const where: Prisma.TaskWhereInput = {};
    if (!isAdmin) {
      where.OR = [
        { assignedToId: session.user.id },
        { createdById: session.user.id },
      ];
    }

    if (search) {
      const searchFilter = {
        contains: search,
        mode: "insensitive" as Prisma.QueryMode,
      };
      if (where.OR) {
        where.AND = [
          { OR: [{ title: searchFilter }, { description: searchFilter }] },
        ];
      } else {
        where.OR = [{ title: searchFilter }, { description: searchFilter }];
      }
    }

    if (statusParam && Object.values(TaskStatus).includes(statusParam)) {
      addCondition(where, "status", statusParam);
    }
    if (priorityParam && Object.values(Priority).includes(priorityParam)) {
      addCondition(where, "priority", priorityParam);
    }
    if (taskTypeParam && Object.values(TaskType).includes(taskTypeParam)) {
      addCondition(where, "type", taskTypeParam);
    }
    if (assignedToIdParam) {
      addCondition(where, "assignedToId", assignedToIdParam);
    }
    if (createdByIdParam) {
      addCondition(where, "createdById", createdByIdParam);
    }
    if (prospectIdParam) {
      addCondition(where, "prospectId", prospectIdParam);
    }

    function addCondition(
      whereObj: Prisma.TaskWhereInput,
      key: keyof Prisma.TaskWhereInput,
      value: any
    ) {
      if (whereObj.OR && !isAdmin) {
        if (!whereObj.AND) whereObj.AND = [];
        (whereObj.AND as Prisma.TaskWhereInput[]).push({ [key]: value });
      } else {
        (whereObj as any)[key] = value;
      }
    }

    const [tasks, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          prospect: { select: { id: true, name: true, company: true } },
        },
        orderBy: { dueDate: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.task.count({ where }),
    ]);

    return NextResponse.json({
      tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const validation = createTaskApiSchema.safeParse(body);
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

    const finalAssignedToId = validatedData.assignedToId || session.user.id;

    let serverDeterminedTaskType = validatedData.type;

    const taskData: Prisma.TaskCreateInput = {
      title: validatedData.title,
      description: validatedData.description,
      priority: validatedData.priority,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null,
      type: serverDeterminedTaskType,
      status: TaskStatus.PENDING,

      createdBy: { connect: { id: session.user.id } },
      assignedTo: { connect: { id: finalAssignedToId } },
      prospect: validatedData.prospectId
        ? { connect: { id: validatedData.prospectId } }
        : undefined,
    };

    const task = await prisma.task.create({
      data: taskData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            phone: true,
          },
        },
        prospect: { select: { id: true, name: true, company: true } },
      },
    });

    if (
      task.assignedTo &&
      task.assignedToId !== session.user.id &&
      task.assignedTo.phone
    ) {
    } else if (task.assignedToId === session.user.id) {
      console.log(
        `Task ${task.id} created and self-assigned by ${session.user.name}. Notification not sent to self.`
      );
    } else if (task.assignedTo && !task.assignedTo.phone) {
      console.warn(
        `Task ${task.id} assigned to ${task.assignedTo.name}, but they have no phone number. Notification not sent.`
      );
    }

    revalidatePath("/(dashboard)/tasks", "page");
    revalidatePath("/(dashboard)/dashboard", "page");

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.CREATE,
      entityType: AuditEntityType.TASK,
      entityId: task.id,
      targetUserId:
        finalAssignedToId !== session.user.id ? finalAssignedToId : undefined,
      details: { createdData: validatedData },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    const session = await auth();
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.TASK,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "CREATE_TASK",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          { error: "Related record (e.g., assignee or prospect) not found." },
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
