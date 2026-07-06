import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN", "MANAGER", "CANDIDATE"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { userId, subscription } = body;

    if (!userId || !subscription) {
      return NextResponse.json({ error: "Missing subscription payload" }, { status: 400 });
    }

    const { endpoint, keys } = subscription;
    if (!endpoint || !keys) {
      return NextResponse.json({ error: "Missing subscription endpoint or keys" }, { status: 400 });
    }

    const { p256dh, auth } = keys;
    if (!p256dh || !auth) {
      return NextResponse.json({ error: "Missing subscription key credentials (p256dh or auth)" }, { status: 400 });
    }

    // Verify user exists
    const dbUser = await prisma.users.findUnique({ where: { id: userId } });
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Upsert subscription based on endpoint
    await prisma.push_subscriptions.upsert({
      where: { endpoint },
      update: {
        user_id: userId,
        p256dh,
        auth,
      },
      create: {
        id: crypto.randomUUID(),
        user_id: userId,
        endpoint,
        p256dh,
        auth,
      },
    });

    return NextResponse.json({ message: "Subscription saved successfully" });
  } catch (error: any) {
    console.error("Subscription save error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
