import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

// PUT /api/admin/holidays/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { holidayName, holidayDate, active, holidayType, description } = body;

    const dateVal = holidayDate ? new Date(holidayDate) : undefined;

    if (dateVal) {
      const existing = await prisma.holidays.findUnique({
        where: { holiday_date: dateVal },
      });
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { error: `A holiday already exists on date ${holidayDate}` },
          { status: 400 }
        );
      }
    }

    const updatedHoliday = await prisma.holidays.update({
      where: { id },
      data: {
        holiday_name: holidayName,
        holiday_date: dateVal,
        is_active: active !== undefined ? active : undefined,
        holiday_type: holidayType !== undefined ? holidayType : undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedHoliday.id,
      holidayName: updatedHoliday.holiday_name,
      holidayDate: updatedHoliday.holiday_date.toISOString().split("T")[0],
      active: updatedHoliday.is_active,
      holidayType: updatedHoliday.holiday_type,
      description: updatedHoliday.description,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/holidays/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.holidays.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Holiday deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
