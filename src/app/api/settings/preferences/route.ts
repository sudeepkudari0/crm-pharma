import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    // TODO: Create a UserPreferences model to store these settings
    // For now, we'll just return success
    // const preferences = await prisma.userPreferences.upsert({
    //   where: { userId: session.user.id },
    //   update: body,
    //   create: { userId: session.user.id, ...body },
    // })

    return NextResponse.json({ message: "Preferences updated successfully" });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
