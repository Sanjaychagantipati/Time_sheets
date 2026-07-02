import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req);
  if (response) return response;

  try {
    const activeHolidays = await prisma.holidays.findMany({
      where: { is_active: true },
      orderBy: { holiday_date: "asc" },
    });

    const formatted = activeHolidays.map((h) => ({
      id: h.id,
      holidayName: h.holiday_name,
      holidayDate: h.holiday_date.toISOString().split("T")[0],
      active: h.is_active,
      holidayType: h.holiday_type,
      description: h.description,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
