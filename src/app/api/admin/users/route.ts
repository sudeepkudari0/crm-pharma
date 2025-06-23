import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || !["SYS_ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { password, adminAccess, ...userData } = body;

    const salt = randomBytes(16).toString("hex");
    const saltedPassword = password + salt;
    const hashedPassword = createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      if (Array.isArray(adminAccess) && adminAccess.length > 0) {
        await tx.userAdminAccess.createMany({
          data: adminAccess.map((associateId: string) => ({
            adminId: user.id,
            userId: associateId,
          })),
        });
      }

      await tx.account.create({
        data: {
          userId: user.id,
          password: hashedPassword,
          salt,
          type: "credentials",
          provider: "credentials",
          providerAccountId: user.id,
        },
      });

      return user;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
