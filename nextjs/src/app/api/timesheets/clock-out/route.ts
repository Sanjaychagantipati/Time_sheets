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
    const { notes, browser, operatingSystem, deviceType, screenResolution, recoveryClockOut } = body;

    const timesheet = await prisma.timesheets.findFirst({
      where: {
        user_id: user.id,
        clock_out: null,
      },
      orderBy: { date: "desc" },
      include: {
        attendance_sessions: {
          orderBy: { clock_in: "asc" },
        },
      },
    });

    if (!timesheet) {
      return NextResponse.json({ error: "No active shift found" }, { status: 404 });
    }

    // Use absolute current server time projected into Asia/Kolkata timezone
    const { eventDate, eventTime: serverClockOutTime, hour, minute, second } = getCurrentISTTime();

    let clockOutTime = serverClockOutTime;
    let hourVal = hour;
    let minuteVal = minute;
    let secondVal = second;
    let finalNotes = notes || null;

    if (recoveryClockOut) {
      // 1. Validate that current server time is after 8:30 PM (20:30)
      if (hour < 20 || (hour === 20 && minute < 30)) {
        return NextResponse.json({ error: "Attendance recovery is only available after 08:30 PM" }, { status: 400 });
      }

      // 2. Validate that timesheet date is today
      const serverDateStr = eventDate.toISOString().split("T")[0];
      const timesheetDateStr = timesheet.date.toISOString().split("T")[0];
      if (timesheetDateStr !== serverDateStr) {
        return NextResponse.json({ error: "You can only recover today's attendance" }, { status: 400 });
      }

      // 3. Parse recoveryClockOut
      const parts = recoveryClockOut.split(":");
      hourVal = parseInt(parts[0]);
      minuteVal = parseInt(parts[1]);
      secondVal = parts[2] ? parseInt(parts[2]) : 0;

      if (isNaN(hourVal) || isNaN(minuteVal) || hourVal < 0 || hourVal > 23 || minuteVal < 0 || minuteVal > 59) {
        return NextResponse.json({ error: "Invalid recovery clock out time format" }, { status: 400 });
      }

      clockOutTime = new Date(Date.UTC(1970, 0, 1, hourVal, minuteVal, secondVal, 0));

      // 4. Validate that recovery time is not in the future
      const testEnd = new Date(eventDate);
      testEnd.setUTCHours(hourVal, minuteVal, secondVal, 0);
      if (testEnd.getTime() > Date.now()) {
        return NextResponse.json({ error: "Actual Clock Out Time cannot be in the future" }, { status: 400 });
      }

      // 5. Append audit notes
      const auditStr = `[Recovery Submitted At: ${new Date().toISOString()}]`;
      finalNotes = finalNotes ? `${finalNotes} ${auditStr}` : auditStr;
    }

    const activeSession = timesheet.attendance_sessions.find((s) => s.clock_out === null);
    if (!activeSession) {
      return NextResponse.json({ error: "No active session found" }, { status: 404 });
    }

    // Calculate working minutes and hours
    const startLdt = new Date(timesheet.date);
    startLdt.setUTCHours(
      activeSession.clock_in.getUTCHours(),
      activeSession.clock_in.getUTCMinutes(),
      activeSession.clock_in.getUTCSeconds(),
      0
    );

    const endLdt = new Date(eventDate);
    endLdt.setUTCHours(hourVal, minuteVal, secondVal, 0);

    const minutes = Math.floor((endLdt.getTime() - startLdt.getTime()) / 60000);
    if (minutes < 0) {
      return NextResponse.json({ error: "Working hours cannot be negative" }, { status: 400 });
    }

    const decimalHours = Number((minutes / 60).toFixed(2));

    // Update active session
    await prisma.attendance_sessions.update({
      where: { id: activeSession.id },
      data: {
        clock_out: clockOutTime,
        hours: decimalHours,
      },
    });

    // Calculate total hours sum of all completed sessions
    const completedSessionsHours =
      timesheet.attendance_sessions
        .filter((s) => s.id !== activeSession.id && s.clock_out !== null)
        .reduce((sum, s) => sum + Number(s.hours || 0), 0) + decimalHours;

    let updatedNotes = timesheet.notes;
    if (finalNotes && finalNotes.trim() !== "") {
      if (!updatedNotes || updatedNotes.trim() === "") {
        updatedNotes = finalNotes.trim();
      } else {
        updatedNotes = updatedNotes + " | " + finalNotes.trim();
      }
    }

    await prisma.timesheets.update({
      where: { id: timesheet.id },
      data: {
        clock_out: clockOutTime,
        hours: completedSessionsHours,
        notes: updatedNotes,
        browser: browser || undefined,
        operating_system: operatingSystem || undefined,
        device_type: deviceType || undefined,
        screen_resolution: screenResolution || undefined,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "127.0.0.1",
        user_agent: req.headers.get("user-agent") || undefined,
      },
    });

    await recalculateTimesheetAggregates(timesheet.id);

    const savedTimesheet = await prisma.timesheets.findUnique({
      where: { id: timesheet.id },
    });

    if (!savedTimesheet) {
      throw new Error("Failed to load saved timesheet");
    }

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

    return NextResponse.json({
      message: "Clocked out successfully",
      log: {
        id: savedTimesheet.id,
        clockOut: formatTime(savedTimesheet.clock_out),
        hours: savedTimesheet.hours ? Number(savedTimesheet.hours) : null,
        notes: savedTimesheet.notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
