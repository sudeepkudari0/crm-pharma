import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const account = await prisma.account.findUnique({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: session.user.id,
        },
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const saltedPassword = currentPassword + account.salt;
    const hashedPassword = createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    if (hashedPassword !== account.password) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const newSaltedPassword = newPassword + account.salt;
    const hashedNewPassword = createHash("sha256")
      .update(newSaltedPassword)
      .digest("hex");

    // Update password
    await prisma.account.update({
      where: {
        provider_providerAccountId: {
          provider: "credentials",
          providerAccountId: session.user.id,
        },
      },
      data: { password: hashedNewPassword },
    });

    return NextResponse.json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error updating password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
