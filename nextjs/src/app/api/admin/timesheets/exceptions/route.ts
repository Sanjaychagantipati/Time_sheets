import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import { calculateAggregates } from "@/lib/attendance";
import { getCurrentISTTime } from "@/lib/attendance";
import { getCompanySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const settings = await getCompanySettings();
    const [startHour, startMin] = settings.office_start_time.split(":").map(Number);
    const lateLimitMin = startHour * 60 + startMin + settings.clock_in_grace_period;

    // Get current date in IST to compare with past dates
    const { eventDate } = getCurrentISTTime();

    const exceptions = await prisma.timesheets.findMany({
      where: {
        clock_out: null,
        date: {
          lt: eventDate
        }
      },
      select: {
        id: true,
        user_id: true,
        date: true,
        clock_in: true,
        clock_out: true,
        hours: true,
        notes: true,
        browser: true,
        operating_system: true,
        device_type: true,
        screen_resolution: true,
        ip_address: true,
        user_agent: true,
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
        clients: {
          select: {
            id: true,
            name: true,
          },
        },
        attendance_sessions: {
          select: {
            id: true,
            clock_in: true,
            clock_out: true,
            hours: true,
          },
          orderBy: { clock_in: "asc" },
        },
      },
      orderBy: [{ date: "desc" }],
    });

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

    const formatted = exceptions.map((t) => {
      const { clockIn, clockOut, hours, sortedSessions } = calculateAggregates(
        t.attendance_sessions,
        t.clock_in,
        t.clock_out,
        t.hours
      );

      const hasActiveSession = sortedSessions.some((s) => s.clock_out === null);

      const inHour = clockIn.getUTCHours();
      const inMinute = clockIn.getUTCMinutes();
      const inTotalMin = inHour * 60 + inMinute;
      const isLate = inTotalMin > lateLimitMin;

      let calculatedStatus = hasActiveSession ? "ACTIVE" : "COMPLETED";
      if (isLate) {
        calculatedStatus = "LATE_CLOCK_IN";
      }

      return {
        id: t.id,
        userId: t.user_id,
        employeeName: t.users.name,
        date: t.date.toISOString().split("T")[0],
        clockIn: formatTime(clockIn),
        clockOut: formatTime(clockOut),
        hours: hours,
        notes: t.notes,
        clientCompany: t.clients.name,
        status: calculatedStatus,
        browser: t.browser,
        operatingSystem: t.operating_system,
        deviceType: t.device_type,
        screenResolution: t.screen_resolution,
        ipAddress: t.ip_address,
        userAgent: t.user_agent,
        sessions: sortedSessions.map((s) => ({
          id: s.id,
          clockIn: formatTime(s.clock_in),
          clockOut: formatTime(s.clock_out),
          hours: s.hours ? Number(s.hours) : null,
        })),
      };
    });

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/timesheets/exceptions error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
