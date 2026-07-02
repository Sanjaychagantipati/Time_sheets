import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { ids } = body;

    if (!ids || !Array.isArray(ids)) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    await prisma.attendance_sessions.deleteMany({
      where: {
        timesheet_id: { in: ids },
      },
    });

    await prisma.timesheets.deleteMany({
      where: {
        id: { in: ids },
      },
    });

    return NextResponse.json({ message: "Timesheet records deleted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
