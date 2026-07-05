import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentISTTime } from "@/lib/attendance";
import webpush from "web-push";

export const dynamic = "force-dynamic";

// Initialize web-push with VAPID details
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@vergiltempo.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const isTest = searchParams.get("test") === "true";
  const forceReminder = searchParams.get("reminder"); // "1", "2", or "3"

  // Secure cron route in production
  const authHeader = req.headers.get("authorization");
  if (!isTest && process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured on server" }, { status: 500 });
  }

  try {
    const { eventDate, hour, minute } = getCurrentISTTime();

    // Determine if we are in a matching reminder slot window (5-minute slot triggers)
    let activeReminder: "1" | "2" | "3" | null = null;

    if (forceReminder === "1" || (!forceReminder && hour === 9 && minute >= 25 && minute < 30)) {
      activeReminder = "1";
    } else if (forceReminder === "2" || (!forceReminder && hour === 18 && minute >= 40 && minute < 45)) {
      activeReminder = "2";
    } else if (forceReminder === "3" || (!forceReminder && hour === 20 && minute >= 30 && minute < 35)) {
      activeReminder = "3";
    }

    // In local testing, if test=true and no reminder is forced, default to reminder 1
    if (isTest && !activeReminder) {
      activeReminder = "1";
    }

    if (!activeReminder) {
      return NextResponse.json({
        message: "No daily attendance reminder scheduled at this time slot.",
        serverTimeIST: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
      });
    }

    // Fetch all candidates
    const candidates = await prisma.users.findMany({
      where: { role: "CANDIDATE" }
    });

    let sentCount = 0;
    let failedCount = 0;
    let purgedCount = 0;

    for (const cand of candidates) {
      // Find today's timesheet for candidate
      const todayTimesheet = await prisma.timesheets.findFirst({
        where: {
          user_id: cand.id,
          date: eventDate
        }
      });

      let shouldNotify = false;
      let notificationTitle = "Vergil Tempo";
      let notificationBody = "Attendance reminder";
      let targetUrl = "/dashboard";

      if (activeReminder === "1") {
        // Reminder 1: Employee has NOT Clocked In today
        shouldNotify = !todayTimesheet;
        notificationTitle = "⏰ Vergil Tempo";
        notificationBody = "Your shift starts in 5 minutes. Tap to Clock In.";
      } else if (activeReminder === "2") {
        // Reminder 2: Employee has Clocked In AND Clock Out is NULL
        shouldNotify = !!todayTimesheet && todayTimesheet.clock_out === null;
        notificationTitle = "⚠ Vergil Tempo";
        notificationBody = "Don't forget to Clock Out before leaving. Tap to open Vergil Tempo.";
      } else if (activeReminder === "3") {
        // Reminder 3: Clock In exists AND Clock Out still NULL
        shouldNotify = !!todayTimesheet && todayTimesheet.clock_out === null;
        notificationTitle = "⚠ Forgot Clock Out";
        notificationBody = "Please recover today's attendance. Tap to continue.";
      }

      if (shouldNotify) {
        // Find push subscriptions for this user
        const subscriptions = await prisma.push_subscriptions.findMany({
          where: { user_id: cand.id }
        });

        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: {
                  p256dh: sub.p256dh,
                  auth: sub.auth
                }
              },
              JSON.stringify({
                title: notificationTitle,
                body: notificationBody,
                url: targetUrl
              })
            );
            sentCount++;
          } catch (err: any) {
            console.error(`Error sending push to sub ${sub.id}:`, err.message);
            // Auto-clean expired / invalid subscription endpoints
            if (err.statusCode === 410 || err.statusCode === 404) {
              await prisma.push_subscriptions.delete({
                where: { id: sub.id }
              });
              purgedCount++;
            } else {
              failedCount++;
            }
          }
        }
      }
    }

    return NextResponse.json({
      message: "Daily attendance reminder evaluation complete.",
      reminderType: activeReminder,
      sentCount,
      failedCount,
      purgedCount,
      serverTimeIST: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
    });
  } catch (error: any) {
    console.error("Cron reminders error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
