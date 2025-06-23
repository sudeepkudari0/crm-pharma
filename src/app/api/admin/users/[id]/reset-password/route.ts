import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || !["ADMIN", "SYS_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { newPassword } = body;

    const { id } = await params;
    if (!newPassword || newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent non-super-admins from resetting super-admin passwords
    if (
      existingUser.role === "SYS_ADMIN" &&
      session.user.role !== "SYS_ADMIN"
    ) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const salt = randomBytes(16).toString("hex");

    const hashedPassword = createHash("sha256")
      .update(newPassword + salt)
      .digest("hex");

    // Update password
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: existingUser.id,
        },
      },
      data: { password: hashedPassword, salt },
    });

    return NextResponse.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Error resetting password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
