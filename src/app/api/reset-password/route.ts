import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { logAudit, AuditActionType, AuditEntityType } from "@/lib/audit-logger";
import { getRequestClientInfo } from "@/lib/server-util";
import { createHash, randomBytes } from "crypto";

const resetPasswordApiSchema = z.object({
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters." })
    .regex(
      /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9]).{6,}$/,
      "Password must contain at least 6 characters, one uppercase, one lowercase, one number and one special case character."
    ),
});

export async function POST(request: NextRequest) {
  let currentUserId: string | undefined = undefined;

  try {
    const session = await auth();
    if (!session?.user?.id || !session.user.role) {
      return NextResponse.json(
        {
          error: true,
          message:
            "Unauthorized: You must be logged in to reset your password.",
        },
        { status: 401 }
      );
    }
    currentUserId = session.user.id;

    const body = await request.json();
    const validation = resetPasswordApiSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: true,
          message: "Invalid input.",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { password: newPassword } = validation.data;

    const user = await prisma.user.findUnique({
      where: { id: currentUserId },
    });

    const salt = randomBytes(16).toString("hex");
    const saltedPassword = newPassword + salt;
    const hashedPassword = createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    await prisma.account.update({
      where: { userId: currentUserId },
      data: {
        salt,
        password: hashedPassword,
      },
    });

    await prisma.user.update({
      where: { id: currentUserId },
      data: {
        firstLogin: false,
      },
    });

    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      userId: currentUserId,
      userName: user?.name,
      userRole: user?.role as string,
      action: AuditActionType.PASSWORD_RESET_SUCCESS,
      entityType: AuditEntityType.USER,
      targetUserId: currentUserId,
      details: { message: "User successfully reset their password." },
      ipAddress,
      userAgent,
    });

    return NextResponse.json({
      success: true,
      message: "Password has been successfully reset.",
    });
  } catch (error) {
    console.error("Error resetting password via API:", error);
    const { ipAddress, userAgent } = await getRequestClientInfo();
    logAudit({
      action: AuditActionType.FAILED,
      entityType: AuditEntityType.USER,
      targetUserId: currentUserId,
      userId: currentUserId,
      details: {
        error: error instanceof Error ? error.message : String(error),
        operation: "API_PASSWORD_RESET_FAILED",
      },
      ipAddress,
      userAgent,
    });
    return NextResponse.json(
      {
        error: true,
        message: "An unexpected error occurred. Please try again.",
      },
      { status: 500 }
    );
  }
}
