import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Check if any super admin already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: "SYS_ADMIN" },
    });

    if (existingSuperAdmin) {
      return NextResponse.json(
        { error: "System administrator already exists" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, email, password } = body;

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      );
    }

    // Hash password

    const salt = randomBytes(16).toString("hex");
    const saltedPassword = password + salt;
    const hashedPassword = createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    // Create super admin user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        role: "SYS_ADMIN",
        isActive: true,
      },
    });

    await prisma.account.create({
      data: {
        userId: user.id,
        type: "credentials",
        provider: "credentials",
        salt,
        providerAccountId: user.id,
        password: hashedPassword,
      },
    });

    // Remove password from response
    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Error creating system admin:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
