import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["EMPLOYEE", "ADMIN"]);
  if (response) return response;
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { clientElapsedMs, notes, browser, operatingSystem, deviceType, screenResolution } = body;

    // Validation: Future timestamps
    if (clientElapsedMs !== undefined && clientElapsedMs < 0) {
      return NextResponse.json({ error: "Future timestamps are not allowed" }, { status: 400 });
    }

    const timesheet = await prisma.timesheets.findFirst({
      where: {
        user_id: user.id,
        clock_out: null,
      },
      include: {
        attendance_sessions: true,
      },
    });

    if (!timesheet) {
      return NextResponse.json({ error: "No active shift found" }, { status: 404 });
    }

    // Time synchronization
    let eventLdt = new Date();
    if (clientElapsedMs !== undefined) {
      eventLdt = new Date(Date.now() - clientElapsedMs);
    }

    const eventDate = new Date(
      Date.UTC(eventLdt.getFullYear(), eventLdt.getMonth(), eventLdt.getDate(), 0, 0, 0, 0)
    );
    const clockOutTime = new Date(
      Date.UTC(
        1970,
        0,
        1,
        eventLdt.getHours(),
        eventLdt.getMinutes(),
        eventLdt.getSeconds(),
        0
      )
    );

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
    endLdt.setUTCHours(eventLdt.getHours(), eventLdt.getMinutes(), eventLdt.getSeconds(), 0);

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
    if (notes && notes.trim() !== "") {
      if (!updatedNotes || updatedNotes.trim() === "") {
        updatedNotes = notes.trim();
      } else {
        updatedNotes = updatedNotes + " | " + notes.trim();
      }
    }

    const savedTimesheet = await prisma.timesheets.update({
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

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : null);

    return NextResponse.json({
      message: "Clocked out successfully",
      log: {
        id: savedTimesheet.id,
        clockOut: formatTime(savedTimesheet.clock_out),
        hours: Number(savedTimesheet.hours),
        notes: savedTimesheet.notes,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
