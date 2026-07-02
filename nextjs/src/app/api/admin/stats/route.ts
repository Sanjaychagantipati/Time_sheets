import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));

    const [activeClockins, totalEmployees, activeClients, totalClients, submittedToday] =
      await Promise.all([
        prisma.timesheets.count({ where: { clock_out: null } }),
        prisma.users.count({ where: { role: "EMPLOYEE" } }),
        prisma.clients.count({ where: { active: true } }),
        prisma.clients.count(),
        prisma.timesheets.groupBy({
          by: ["user_id"],
          where: {
            date: today,
            OR: [{ clock_out: { not: null } }, { hours: { gt: 0 } }],
          },
        }),
      ]);

    return NextResponse.json({
      currentlyClockedIn: activeClockins,
      activeEmployees: activeClockins,
      totalEmployees,
      activeClients,
      totalClients,
      timesheetsSubmittedToday: submittedToday.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
