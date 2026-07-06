import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import { getCompanySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN", "MANAGER"]);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const settings = await getCompanySettings();
    
    // Get today's local date based on settings timezone
    const localDateStr = new Intl.DateTimeFormat("en-US", {
      timeZone: settings.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(new Date());

    const [m, d, y] = localDateStr.split("/");
    const todayLocal = new Date(`${y}-${m}-${d}`);

    // 1. Check active timesheet
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

    // 2. Check if today is a company holiday
    const holiday = await prisma.holidays.findFirst({
      where: {
        holiday_date: todayLocal,
        is_active: true,
      },
    });

    if (holiday) {
      return NextResponse.json({
        hasActive: false,
        log: null,
        isHoliday: true,
        holidayName: holiday.holiday_name,
      });
    }

    // 3. Check if user is on approved leave today
    const leave = await prisma.leaves.findFirst({
      where: {
        user_id: user.id,
        start_date: { lte: todayLocal },
        end_date: { gte: todayLocal },
      },
    });

    if (leave) {
      return NextResponse.json({
        hasActive: false,
        log: null,
        isOnLeave: true,
        leaveType: leave.leave_type,
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
