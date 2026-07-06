import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import webpush from "web-push";

export const dynamic = "force-dynamic";

// Initialize web-push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@vergiltempo.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

export async function POST(req: NextRequest) {
  // Allow admins or managers to send notifications, or candidates to self-test send
  const { user, response } = await checkAuth(req, ["CANDIDATE", "ADMIN", "MANAGER"]);
  if (response) return response;
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
    return NextResponse.json({ error: "VAPID keys not configured on server" }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { userId, title, body: pushBody, url } = body;

    if (!userId || !title || !pushBody) {
      return NextResponse.json({ error: "Missing required fields: userId, title, body" }, { status: 400 });
    }

    // If candidate is requesting, ensure they only send to themselves
    if (user.role === "CANDIDATE" && user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized: Candidates can only send push notifications to themselves" }, { status: 403 });
    }

    // Get push subscriptions for this user
    const subscriptions = await prisma.push_subscriptions.findMany({
      where: { user_id: userId }
    });

    if (subscriptions.length === 0) {
      return NextResponse.json({ message: "No active push subscriptions found for this user." }, { status: 404 });
    }

    let sentCount = 0;
    let purgedCount = 0;

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
            title,
            body: pushBody,
            url: url || "/dashboard"
          })
        );
        sentCount++;
      } catch (err: any) {
        console.error(`Error sending push notification to subscription ${sub.id}:`, err.message);
        // Automatically prune expired/invalid subscription tokens
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.push_subscriptions.delete({
            where: { id: sub.id }
          });
          purgedCount++;
        }
      }
    }

    return NextResponse.json({
      message: "Push notifications dispatched successfully.",
      recipientId: userId,
      sentCount,
      purgedCount
    });
  } catch (error: any) {
    console.error("Manual push sending error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
