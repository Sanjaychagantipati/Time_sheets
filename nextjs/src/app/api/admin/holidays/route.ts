import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

// GET /api/admin/holidays
export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const holidaysList = await prisma.holidays.findMany({
      orderBy: { holiday_date: "asc" },
    });

    const formatted = holidaysList.map((h) => ({
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

// POST /api/admin/holidays
export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { holidayName, holidayDate, active, holidayType, description } = body;

    if (!holidayName || !holidayDate) {
      return NextResponse.json({ error: "Holiday name and date are required" }, { status: 400 });
    }

    const dateVal = new Date(holidayDate);

    const existing = await prisma.holidays.findUnique({
      where: { holiday_date: dateVal },
    });
    if (existing) {
      return NextResponse.json(
        { error: `A holiday already exists on date ${holidayDate}` },
        { status: 400 }
      );
    }

    const newHoliday = await prisma.holidays.create({
      data: {
        id: crypto.randomUUID(),
        holiday_name: holidayName,
        holiday_date: dateVal,
        is_active: active !== undefined ? active : true,
        holiday_type: holidayType || "COMPANY",
        description: description || null,
      },
    });

    return NextResponse.json(
      {
        id: newHoliday.id,
        holidayName: newHoliday.holiday_name,
        holidayDate: newHoliday.holiday_date.toISOString().split("T")[0],
        active: newHoliday.is_active,
        holidayType: newHoliday.holiday_type,
        description: newHoliday.description,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
