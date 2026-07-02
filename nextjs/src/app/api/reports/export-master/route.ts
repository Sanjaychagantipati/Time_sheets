import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const searchParams = req.nextUrl.searchParams;
    const userId = searchParams.get("userId");
    const client = searchParams.get("client");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    const whereClause: any = {
      clock_out: { not: null },
    };

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
      include: {
        users: true,
        clients: true,
      },
      orderBy: { date: "desc" },
    });

    const formatTime = (d: Date | null) => (d ? d.toISOString().split("T")[1].slice(0, 8) : "N/A");

    let csvContent =
      "Candidate Name,Client Company,Date,Clock In,Clock Out,Total Hours,Work Notes\n";

    const csvQuote = (str: string | null) => {
      if (!str) return '""';
      return `"${str.replace(/"/g, '""')}"`;
    };

    for (const t of timesheets) {
      const name = csvQuote(t.users.name);
      const clientName = csvQuote(t.clients.name);
      const dateStr = csvQuote(t.date.toISOString().split("T")[0]);
      const clockIn = csvQuote(formatTime(t.clock_in));
      const clockOut = csvQuote(formatTime(t.clock_out));
      const hours = t.hours ? t.hours.toString() : "N/A";
      const notes = csvQuote(t.notes);

      csvContent += `${name},${clientName},${dateStr},${clockIn},${clockOut},${hours},${notes}\n`;
    }

    const res = new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename=Vergil_Tempo_Timesheets_${new Date().toISOString().slice(0, 10)}.csv`,
      },
    });

    return res;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
