import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  const authorizationHeader = request.headers.get("Authorization");
  if (authorizationHeader !== `Bearer ${CRON_SECRET}`) {
    console.warn("Unauthorized attempt to run cron job: send-reminders");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Cron job: send-reminders started at", new Date().toISOString());

  try {
    const nowInIST = dayjs().tz("Asia/Kolkata");

    const nextDayStartIST = nowInIST.add(1, "day").startOf("day");

    const nextDayEndIST = nowInIST.add(1, "day").endOf("day");

    const nextDayStartUTC = nextDayStartIST.utc().toDate();
    const nextDayEndUTC = nextDayEndIST.utc().toDate();

    console.log(
      `Querying for next actions due between (UTC): ${nextDayStartUTC.toISOString()} and ${nextDayEndUTC.toISOString()}`
    );

    const activitiesToRemind = await prisma.activity.findMany({
      where: {
        nextActionDate: {
          gte: nextDayStartUTC,
          lte: nextDayEndUTC,
        },
        nextActionReminderSent: false,
        nextActionType: { not: null },
        OR: [
          { nextActionType: { not: "" } },
          { nextActionDetails: { not: null } },
          { nextActionDetails: { not: "" } },
        ],
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true },
        },
        prospect: {
          select: { id: true, name: true, phone: true },
        },
      },
    });

    if (activitiesToRemind.length === 0) {
      console.log("No activities found for next-day reminders.");
      return NextResponse.json({ message: "No reminders to send." });
    }

    console.log(`Found ${activitiesToRemind.length} activities for reminders.`);
    let remindersSentCount = 0;
    const reminderErrors: any[] = [];

    for (const activity of activitiesToRemind) {
      if (!activity.user || !activity.user.phone) {
        console.warn(
          `Skipping reminder for activity ID ${activity.id}: User or user phone not found.`
        );
        reminderErrors.push({
          activityId: activity.id,
          error: "User or phone missing",
        });
        continue;
      }
      if (!activity.prospect) {
        console.warn(
          `Skipping reminder for activity ID ${activity.id}: Prospect not found.`
        );

        reminderErrors.push({
          activityId: activity.id,
          error: "Prospect missing",
        });
        continue;
      }

      let actionDescription = activity.nextActionType
        ? activity.nextActionType.replace(/_/g, " ")
        : "your scheduled action";
      if (activity.nextActionDetails) {
        actionDescription += `: ${activity.nextActionDetails}`;
      }

      const prospectName = activity.prospect.name || "the prospect";
      const dueDateTime = dayjs(activity.nextActionDate)
        .tz("Asia/Kolkata")
        .format("dddd, MMMM D, YYYY h:mm A");

      const detailsLink = `${process.env.NEXT_PUBLIC_BASE_URL}/activities`;

      console.log(
        `Preparing to send reminder for activity ID ${activity.id} to ${activity.user.name}`
      );

      await prisma.activity.update({
        where: { id: activity.id },
        data: { nextActionReminderSent: true },
      });

      remindersSentCount++;
    }

    const summaryMessage = `Cron job completed. Sent ${remindersSentCount} reminders. ${
      reminderErrors.length > 0
        ? `Encountered ${reminderErrors.length} errors.`
        : ""
    }`;
    console.log(summaryMessage);
    if (reminderErrors.length > 0)
      console.error("Reminder errors:", reminderErrors);

    return NextResponse.json({
      message: summaryMessage,
      sent: remindersSentCount,
      errors: reminderErrors.length,
      errorDetails: reminderErrors,
    });
  } catch (error) {
    console.error("Error in cron job: send-reminders:", error);
    return NextResponse.json(
      {
        error: "Internal Server Error during cron execution.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
