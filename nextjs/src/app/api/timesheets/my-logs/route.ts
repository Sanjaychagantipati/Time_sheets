import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import { calculateAggregates } from "@/lib/attendance";


export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN"]);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const timesheets = await prisma.timesheets.findMany({
      where: { user_id: user.id },
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
      orderBy: { date: "desc" },
    });

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

    const formatted = timesheets.map((t) => {
      const { clockIn, clockOut, hours, sortedSessions } = calculateAggregates(
        t.attendance_sessions,
        t.clock_in,
        t.clock_out,
        t.hours
      );

      const hasActiveSession = sortedSessions.some((s) => s.clock_out === null);

      return {
        id: t.id,
        userId: t.user_id,
        date: t.date.toISOString().split("T")[0],
        clockIn: formatTime(clockIn),
        clockOut: formatTime(clockOut),
        hours: hours,
        notes: t.notes,
        clientCompany: t.clients.name,
        status: hasActiveSession ? "ACTIVE" : "COMPLETED",
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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
