import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import { recalculateTimesheetAggregates, getCurrentISTTime } from "@/lib/attendance";


export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN"]);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { browser, operatingSystem, deviceType, screenResolution } = body;

    // Use absolute current server time projected into Asia/Kolkata timezone
    const { eventDate, eventTime: eventClockIn } = getCurrentISTTime();

    // Reject clock-in on company holidays
    const holiday = await prisma.holidays.findFirst({
      where: {
        holiday_date: eventDate,
        is_active: true,
      },
    });
    if (holiday) {
      return NextResponse.json(
        { error: "Today is a company holiday. Clock-in is disabled." },
        { status: 403 }
      );
    }

    const dbUser = await prisma.users.findUnique({
      where: { id: user.id },
    });
    if (!dbUser || !dbUser.client_id) {
      return NextResponse.json(
        { error: "User is not assigned to any client company" },
        { status: 403 }
      );
    }

    // Check if there is an active timesheet
    const activeTimesheet = await prisma.timesheets.findFirst({
      where: {
        user_id: user.id,
        clock_out: null,
      },
      orderBy: { date: "desc" },
    });
    if (activeTimesheet) {
      return NextResponse.json({ error: "Active shift already exists" }, { status: 400 });
    }

    // Check if a timesheet for today already exists
    const existingTimesheet = await prisma.timesheets.findFirst({
      where: {
        user_id: user.id,
        date: eventDate,
      },
      include: {
        attendance_sessions: true,
      },
    });

    let timesheetId = "";
    if (existingTimesheet) {
      timesheetId = existingTimesheet.id;

      const hasActiveSession = existingTimesheet.attendance_sessions.some(
        (s) => s.clock_out === null
      );
      if (hasActiveSession) {
        return NextResponse.json({ error: "Active shift already exists" }, { status: 400 });
      }

      // Validate overlapping sessions
      const overlaps = existingTimesheet.attendance_sessions.some((s) => {
        if (s.clock_out === null) return false;
        return eventClockIn >= s.clock_in && eventClockIn <= s.clock_out;
      });
      if (overlaps) {
        return NextResponse.json(
          { error: "Clock in time overlaps with an existing session" },
          { status: 400 }
        );
      }

      // Reactivate parent timesheet
      await prisma.timesheets.update({
        where: { id: timesheetId },
        data: {
          clock_out: null,
          browser: browser || undefined,
          operating_system: operatingSystem || undefined,
          device_type: deviceType || undefined,
          screen_resolution: screenResolution || undefined,
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
          user_agent: req.headers.get("user-agent") || undefined,
        },
      });
    } else {
      timesheetId = crypto.randomUUID();

      await prisma.timesheets.create({
        data: {
          id: timesheetId,
          user_id: user.id,
          client_id: dbUser.client_id,
          date: eventDate,
          clock_in: eventClockIn,
          clock_out: null,
          browser: browser || undefined,
          operating_system: operatingSystem || undefined,
          device_type: deviceType || undefined,
          screen_resolution: screenResolution || undefined,
          ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
          user_agent: req.headers.get("user-agent") || undefined,
        },
      });
    }

    // Create new attendance session
    const sessionId = crypto.randomUUID();
    await prisma.attendance_sessions.create({
      data: {
        id: sessionId,
        timesheet_id: timesheetId,
        clock_in: eventClockIn,
        clock_out: null,
      },
    });

    await recalculateTimesheetAggregates(timesheetId);

    const savedTimesheet = await prisma.timesheets.findUnique({
      where: { id: timesheetId },
      include: {
        users: { include: { clients: true } },
        clients: true,
        attendance_sessions: true,
      },
    });

    if (!savedTimesheet) {
      throw new Error("Failed to save timesheet");
    }

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

    const logDto = {
      id: savedTimesheet.id,
      userId: savedTimesheet.user_id,
      date: savedTimesheet.date.toISOString().split("T")[0],
      clockIn: formatTime(savedTimesheet.clock_in),
      clockOut: formatTime(savedTimesheet.clock_out),
      hours: savedTimesheet.hours ? Number(savedTimesheet.hours) : null,
      notes: savedTimesheet.notes,
      clientCompany: savedTimesheet.clients.name,
      status: "ACTIVE",
      browser: savedTimesheet.browser,
      operatingSystem: savedTimesheet.operating_system,
      deviceType: savedTimesheet.device_type,
      screenResolution: savedTimesheet.screen_resolution,
      ipAddress: savedTimesheet.ip_address,
      userAgent: savedTimesheet.user_agent,
      sessions: savedTimesheet.attendance_sessions.map((s) => ({
        id: s.id,
        clockIn: formatTime(s.clock_in),
        clockOut: formatTime(s.clock_out),
        hours: s.hours ? Number(s.hours) : null,
      })),
    };

    return NextResponse.json(
      {
        message: "Clocked in successfully",
        log: logDto,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
