import { prisma } from "./prisma";

interface SessionInput {
  id: string;
  clock_in: Date;
  clock_out: Date | null;
  hours: any;
}

export function calculateAggregates(
  sessions: SessionInput[],
  fallbackClockIn: Date,
  fallbackClockOut: Date | null,
  fallbackHours: any
) {
  // Sort sessions chronologically by clock_in (actual Date objects)
  const sortedSessions = [...sessions].sort((a, b) => a.clock_in.getTime() - b.clock_in.getTime());

  let earliestClockIn = fallbackClockIn;
  let latestClockOut = fallbackClockOut;
  let finalHours = fallbackHours !== null ? Number(fallbackHours) : null;

  if (sortedSessions.length > 0) {
    // 1. Earliest valid clock_in
    earliestClockIn = sortedSessions[0].clock_in;

    // 2. Latest valid clock_out. But if any session is active (clock_out is null), latestClockOut is null!
    const hasActiveSession = sortedSessions.some((s) => s.clock_out === null);
    if (hasActiveSession) {
      latestClockOut = null;
    } else {
      const completedOutTimes = sortedSessions
        .map((s) => s.clock_out)
        .filter((d): d is Date => d !== null);
      if (completedOutTimes.length > 0) {
        latestClockOut = new Date(Math.max(...completedOutTimes.map((d) => d.getTime())));
      } else {
        latestClockOut = null;
      }
    }

    // 3. Total Hours: Sum of completed valid sessions (ignore negative/invalid durations)
    let totalHoursSum = 0;
    for (const s of sortedSessions) {
      if (s.clock_in && s.clock_out) {
        const diffMs = s.clock_out.getTime() - s.clock_in.getTime();
        if (diffMs > 0) {
          totalHoursSum += diffMs / (1000 * 60 * 60);
        }
      }
    }
    finalHours = totalHoursSum > 0 ? Number(totalHoursSum.toFixed(2)) : null;
  }

  return {
    clockIn: earliestClockIn,
    clockOut: latestClockOut,
    hours: finalHours,
    sortedSessions,
  };
}

export async function recalculateTimesheetAggregates(timesheetId: string) {
  // Fetch timesheet
  const timesheet = await prisma.timesheets.findUnique({
    where: { id: timesheetId },
    include: {
      attendance_sessions: {
        orderBy: { clock_in: "asc" },
      },
    },
  });

  if (!timesheet) return;

  const { clockIn, clockOut, hours } = calculateAggregates(
    timesheet.attendance_sessions,
    timesheet.clock_in,
    timesheet.clock_out,
    timesheet.hours
  );

  await prisma.timesheets.update({
    where: { id: timesheetId },
    data: {
      clock_in: clockIn,
      clock_out: clockOut,
      hours: hours,
    },
  });
}
