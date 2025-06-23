import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || !["SYS_ADMIN"].includes(session.user.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const associates = await prisma.user.findMany({
      where: { role: "ASSOCIATE" },
      select: { id: true, name: true },
    });

    return NextResponse.json(associates);
  } catch (error) {
    console.error("Failed to fetch associates:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
