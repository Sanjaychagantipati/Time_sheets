import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN", "MANAGER"]);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const activeTimesheet = await prisma.timesheets.findFirst({
      where: {
        user_id: user.id,
        clock_out: null,
      },
      orderBy: { date: "desc" },
      select: {
        id: true,
        user_id: true,
        date: true,
        clock_in: true,
        clock_out: true,
        hours: true,
        notes: true,
        clients: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (activeTimesheet) {
      const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

      return NextResponse.json({
        hasActive: true,
        log: {
          id: activeTimesheet.id,
          userId: activeTimesheet.user_id,
          date: activeTimesheet.date.toISOString().split("T")[0],
          clockIn: formatTime(activeTimesheet.clock_in),
          clockOut: null,
          hours: null,
          notes: activeTimesheet.notes,
          clientCompany: activeTimesheet.clients.name,
        },
      });
    }

    return NextResponse.json({
      hasActive: false,
      log: null,
    });
  } catch (error: any) {
    console.error("Error retrieving active timesheet status:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
