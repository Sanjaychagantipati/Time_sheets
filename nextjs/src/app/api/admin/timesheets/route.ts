import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

// GET /api/admin/timesheets
export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const client = searchParams.get("client");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {};

    if (userId && userId !== "all") {
      whereClause.user_id = userId;
    }
    if (client && client !== "all") {
      whereClause.clients = { name: client };
    }
    if (startDate || endDate) {
      whereClause.date = {};
      if (startDate) {
        whereClause.date.gte = new Date(startDate);
      }
      if (endDate) {
        whereClause.date.lte = new Date(endDate);
      }
    }

    const timesheets = await prisma.timesheets.findMany({
      where: whereClause,
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

    const formatted = timesheets.map((t) => ({
      id: t.id,
      userId: t.user_id,
      employeeName: t.users.name,
      date: t.date.toISOString().split("T")[0],
      clockIn: formatTime(t.clock_in),
      clockOut: formatTime(t.clock_out),
      hours: t.hours ? Number(t.hours) : null,
      notes: t.notes,
      clientCompany: t.clients.name,
      status: t.clock_out === null ? "ACTIVE" : "COMPLETED",
      browser: t.browser,
      operatingSystem: t.operating_system,
      deviceType: t.device_type,
      screenResolution: t.screen_resolution,
      ipAddress: t.ip_address,
      userAgent: t.user_agent,
      sessions: t.attendance_sessions.map((s) => ({
        id: s.id,
        clockIn: formatTime(s.clock_in),
        clockOut: formatTime(s.clock_out),
        hours: s.hours ? Number(s.hours) : null,
      })),
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/timesheets
export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { userId, date, clockIn, clockOut, notes } = body;

    if (!userId || !date) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!clockIn && !clockOut) {
      return NextResponse.json({ error: "At least one of Clock In or Clock Out must be provided" }, { status: 400 });
    }

    const employee = await prisma.users.findUnique({
      where: { id: userId },
      include: { clients: true },
    });
    if (!employee || !employee.client_id) {
      return NextResponse.json(
        { error: "Employee must belong to a client company" },
        { status: 400 }
      );
    }

    // Deterministically parse date in UTC to prevent local timezone offset shifts
    const dateParts = date.split("-");
    if (dateParts.length < 3) {
      return NextResponse.json({ error: "Invalid date format. Expected YYYY-MM-DD" }, { status: 400 });
    }
    const dateVal = new Date(
      Date.UTC(
        parseInt(dateParts[0]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[2]),
        0, 0, 0, 0
      )
    );

    const parseTime = (timeStr: string) => {
      const parts = timeStr.split(":");
      if (parts.length < 2) return null;
      const h = parseInt(parts[0]);
      const m = parseInt(parts[1]);
      const s = parts[2] ? parseInt(parts[2]) : 0;
      if (isNaN(h) || isNaN(m) || isNaN(s) || h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
        return null;
      }
      return new Date(
        Date.UTC(
          1970,
          0,
          1,
          h,
          m,
          s,
          0
        )
      );
    };

    const inTime = clockIn ? parseTime(clockIn) : null;
    if (clockIn && !inTime) {
      return NextResponse.json({ error: "Invalid Clock In time format. Expected HH:MM or HH:MM:SS" }, { status: 400 });
    }

    const outTime = clockOut ? parseTime(clockOut) : null;
    if (clockOut && !outTime) {
      return NextResponse.json({ error: "Invalid Clock Out time format. Expected HH:MM or HH:MM:SS" }, { status: 400 });
    }

    const timesOverlap = (in1: Date, out1: Date | null, in2: Date, out2: Date | null) => {
      const t1_start = in1.getTime();
      const t1_end = out1 ? out1.getTime() : Infinity;
      const t2_start = in2.getTime();
      const t2_end = out2 ? out2.getTime() : Infinity;
      return t1_start < t2_end && t2_start < t1_end;
    };

    // --- Scenario A: Only Clock In is provided ---
    if (inTime && !outTime) {
      // Prevent duplicate active clock-in sessions on this date
      const activeTimesheet = await prisma.timesheets.findFirst({
        where: {
          user_id: userId,
          date: dateVal,
          clock_out: null,
        },
      });
      if (activeTimesheet) {
        return NextResponse.json(
          { error: "A duplicate active clock-in session already exists for this candidate on this date." },
          { status: 400 }
        );
      }

      // Check overlap
      const existingTimesheets = await prisma.timesheets.findMany({
        where: {
          user_id: userId,
          date: dateVal,
        },
      });
      for (const ext of existingTimesheets) {
        if (timesOverlap(inTime, null, ext.clock_in, ext.clock_out)) {
          return NextResponse.json(
            { error: "This time range overlaps with an existing attendance record for this candidate on this date." },
            { status: 400 }
          );
        }
      }

      const timesheetId = crypto.randomUUID();
      await prisma.timesheets.create({
        data: {
          id: timesheetId,
          user_id: userId,
          client_id: employee.client_id,
          date: dateVal,
          clock_in: inTime,
          clock_out: null,
          hours: null,
          notes: notes || null,
          browser: "Admin Portal",
          operating_system: "System Admin",
          device_type: "Desktop",
          ip_address: "127.0.0.1",
        },
      });

      const sessionId = crypto.randomUUID();
      await prisma.attendance_sessions.create({
        data: {
          id: sessionId,
          timesheet_id: timesheetId,
          clock_in: inTime,
          clock_out: null,
          hours: null,
        },
      });

      return NextResponse.json({ message: "Manual active entry created", id: timesheetId }, { status: 201 });
    }

    // --- Scenario B: Only Clock Out is provided ---
    if (!inTime && outTime) {
      // Find today's open timesheet record for the candidate
      const openTimesheet = await prisma.timesheets.findFirst({
        where: {
          user_id: userId,
          date: dateVal,
          clock_out: null,
        },
        include: { attendance_sessions: true },
      });

      if (!openTimesheet) {
        return NextResponse.json(
          { error: "No active clock-in record found for this candidate on this date to update." },
          { status: 400 }
        );
      }

      // Validate clock out is not earlier than the existing clock in
      const minutes = Math.floor((outTime.getTime() - openTimesheet.clock_in.getTime()) / 60000);
      if (minutes < 0) {
        return NextResponse.json({ error: "Clock Out time cannot be earlier than Clock In time" }, { status: 400 });
      }
      const hours = Number((minutes / 60).toFixed(2));

      await prisma.timesheets.update({
        where: { id: openTimesheet.id },
        data: {
          clock_out: outTime,
          hours: hours,
          notes: notes || openTimesheet.notes,
        },
      });

      if (openTimesheet.attendance_sessions.length > 0) {
        await prisma.attendance_sessions.update({
          where: { id: openTimesheet.attendance_sessions[0].id },
          data: {
            clock_out: outTime,
            hours: hours,
          },
        });
      }

      return NextResponse.json({ message: "Clock out updated successfully", id: openTimesheet.id }, { status: 200 });
    }

    // --- Scenario C: Both Clock In and Clock Out are provided ---
    if (inTime && outTime) {
      const minutes = Math.floor((outTime.getTime() - inTime.getTime()) / 60000);
      if (minutes < 0) {
        return NextResponse.json({ error: "Clock Out time cannot be earlier than Clock In time" }, { status: 400 });
      }
      const hours = Number((minutes / 60).toFixed(2));

      // Overlap validation check
      const existingTimesheets = await prisma.timesheets.findMany({
        where: {
          user_id: userId,
          date: dateVal,
        },
      });

      for (const ext of existingTimesheets) {
        if (timesOverlap(inTime, outTime, ext.clock_in, ext.clock_out)) {
          return NextResponse.json(
            { error: "This time range overlaps with an existing attendance record for this candidate on this date." },
            { status: 400 }
          );
        }
      }

      const timesheetId = crypto.randomUUID();
      await prisma.timesheets.create({
        data: {
          id: timesheetId,
          user_id: userId,
          client_id: employee.client_id,
          date: dateVal,
          clock_in: inTime,
          clock_out: outTime,
          hours: hours,
          notes: notes || null,
          browser: "Admin Portal",
          operating_system: "System Admin",
          device_type: "Desktop",
          ip_address: "127.0.0.1",
        },
      });

      const sessionId = crypto.randomUUID();
      await prisma.attendance_sessions.create({
        data: {
          id: sessionId,
          timesheet_id: timesheetId,
          clock_in: inTime,
          clock_out: outTime,
          hours: hours,
        },
      });

      return NextResponse.json({ message: "Manual entry created", id: timesheetId }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid attendance input parameters" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
