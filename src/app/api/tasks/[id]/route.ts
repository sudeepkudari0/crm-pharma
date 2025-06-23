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
import { getRequestClientInfo } from "@/lib/server-util";
import { logAudit } from "@/lib/audit-logger";

const updateTaskApiSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters.").optional(),
  description: z.string().optional().nullable(),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(Priority).optional(),
  dueDate: z
    .string()
    .datetime({ offset: true, message: "Invalid date format for Due Date." })
    .optional()
    .nullable(),
  completedAt: z
    .string()
    .datetime({
      offset: true,
      message: "Invalid date format for Completed At.",
    })
    .optional()
    .nullable(),
  assignedToId: z.string().optional().nullable(),
  prospectId: z.string().optional().nullable(),
  type: z.nativeEnum(TaskType).optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        prospect: { select: { id: true, name: true, company: true } },
      },
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error(`Error fetching task:`, error);
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
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const body = await request.json();

    const validation = updateTaskApiSchema.safeParse(body);
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

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: {
        createdBy: { select: { role: true, id: true } },
        assignedTo: { select: { role: true, id: true } },
      },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin = [UserRole.SYS_ADMIN].includes(
      session.user.role as "SYS_ADMIN"
    );

    if (
      !isAdmin &&
      existingTask.createdById !== session.user.id &&
      existingTask.assignedToId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Forbidden: You cannot edit this task." },
        { status: 403 }
      );
    }

    const updateData: Prisma.TaskUpdateInput = {};

    if (validatedData.title !== undefined)
      updateData.title = validatedData.title;
    if (validatedData.hasOwnProperty("description"))
      updateData.description = validatedData.description;
    if (validatedData.status !== undefined)
      updateData.status = validatedData.status;
    if (validatedData.priority !== undefined)
      updateData.priority = validatedData.priority;

    if (validatedData.hasOwnProperty("dueDate")) {
      updateData.dueDate = validatedData.dueDate
        ? new Date(validatedData.dueDate)
        : null;
    }
    if (validatedData.hasOwnProperty("completedAt")) {
      updateData.completedAt = validatedData.completedAt
        ? new Date(validatedData.completedAt)
        : null;

      if (
        validatedData.completedAt &&
        validatedData.status !== TaskStatus.COMPLETED
      ) {
        updateData.status = TaskStatus.COMPLETED;
      }
    }

    if (validatedData.hasOwnProperty("prospectId")) {
      updateData.prospect = validatedData.prospectId
        ? { connect: { id: validatedData.prospectId } }
        : { disconnect: true };
    }

    if (validatedData.hasOwnProperty("assignedToId")) {
      const newAssignedToId =
        validatedData.assignedToId || existingTask.createdById;

      updateData.assignedTo = newAssignedToId
        ? { connect: { id: newAssignedToId } }
        : { disconnect: true };

      if (validatedData.type !== undefined) {
        updateData.type = validatedData.type;
      } else if (newAssignedToId !== existingTask.assignedToId) {
        console.warn(
          "Task assignee changed but 'type' was not provided by client. Task type might be stale."
        );
      }
    } else if (
      validatedData.type !== undefined &&
      validatedData.type !== existingTask.type
    ) {
      updateData.type = validatedData.type;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: "No fields to update.", task: existingTask },
        { status: 200 }
      );
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
            role: true,
          },
        },
        prospect: { select: { id: true, name: true, company: true } },
      },
    });

    revalidatePath("/(dashboard)/tasks", "page");
    revalidatePath("/(dashboard)/dashboard", "page");
    if (updatedTask.prospectId) {
      revalidatePath(`/(dashboard)/prospects`, "page");
    }

    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    for (const key in updateData) {
      if (updateData.hasOwnProperty(key) && existingTask.hasOwnProperty(key)) {
        const typedKey = key as keyof typeof existingTask;
        if (
          JSON.stringify(existingTask[typedKey]) !==
          JSON.stringify(updateData[typedKey as keyof typeof updateData])
        ) {
          changes[key] = {
            oldValue: existingTask[typedKey],
            newValue: updateData[typedKey as keyof typeof updateData],
          };
        }
      }
    }

    const { ipAddress, userAgent } = await getRequestClientInfo();

    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.UPDATE,
      entityType: AuditEntityType.TASK,
      entityId: id,
      details: { updatedDataSnapshot: changes },
      ipAddress,
      userAgent,
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error(`Error updating task:`, error);
    const { ipAddress, userAgent } = await getRequestClientInfo();
    const session = await auth();
    const userId = session?.user?.id;
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.TASK,
      entityId: (await params).id,
      userId: userId,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "UPDATE_TASK_FAILED",
      },
      ipAddress,
      userAgent,
    });
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return NextResponse.json(
          {
            error:
              "Task or a related record (e.g., assignee, prospect) not found.",
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
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Task ID is required" },
        { status: 400 }
      );
    }

    const existingTask = await prisma.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const isAdmin = [UserRole.SYS_ADMIN].includes(
      session.user.role as "SYS_ADMIN"
    );

    if (!isAdmin && existingTask.createdById !== session.user.id) {
      return NextResponse.json(
        { error: "Forbidden: You cannot delete this task." },
        { status: 403 }
      );
    }

    const deletedTask = await prisma.task.delete({ where: { id } });

    revalidatePath("/(dashboard)/tasks", "page");
    revalidatePath("/(dashboard)/dashboard", "page");
    if (deletedTask.prospectId) {
      revalidatePath(`/(dashboard)/prospects`, "page");
    }

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: session.user.id,
      userName: session.user.name || null,
      userRole: session.user.role,
      action: AuditActionType.DELETE,
      entityType: AuditEntityType.TASK,
      entityId: id,
      details: { deletedDataSnapshot: existingTask },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error(`Error deleting task:`, error);
    const { ipAddress, userAgent } = await getRequestClientInfo();
    const session = await auth();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.TASK,
      entityId: (await params).id,
      userId: session?.user?.id,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "DELETE_TASK_FAILED",
      },
      ipAddress,
      userAgent,
    });
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json(
        { error: "Task not found or already deleted." },
        { status: 404 }
      );
    }
    return NextResponse.json(
      { error: "Internal server error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
