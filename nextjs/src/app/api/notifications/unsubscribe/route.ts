import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN", "MANAGER", "CANDIDATE"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: "Missing subscription endpoint" }, { status: 400 });
    }

    // Delete matching subscription
    await prisma.push_subscriptions.deleteMany({
      where: { endpoint },
    });

    return NextResponse.json({ message: "Subscription removed successfully" });
  } catch (error: any) {
    console.error("Subscription removal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
