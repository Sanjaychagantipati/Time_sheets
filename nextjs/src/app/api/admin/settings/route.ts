import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import { getCompanySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const settings = await getCompanySettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const {
      office_start_time,
      office_end_time,
      clock_in_grace_period,
      clock_out_grace_period,
      clock_in_reminder_offset,
      clock_out_reminder_offset,
      attendance_recovery_enabled,
      recovery_deadline,
      weekend_configuration,
      timezone,
    } = body;

    // Basic validation
    if (!office_start_time || !office_end_time || !recovery_deadline || !timezone) {
      return NextResponse.json({ error: "Missing required settings fields" }, { status: 400 });
    }

    const settings = await prisma.company_settings.upsert({
      where: { id: "active" },
      update: {
        office_start_time,
        office_end_time,
        clock_in_grace_period: Number(clock_in_grace_period),
        clock_out_grace_period: Number(clock_out_grace_period),
        clock_in_reminder_offset: Number(clock_in_reminder_offset),
        clock_out_reminder_offset: Number(clock_out_reminder_offset),
        attendance_recovery_enabled: Boolean(attendance_recovery_enabled),
        recovery_deadline,
        weekend_configuration,
        timezone,
        updated_at: new Date(),
      },
      create: {
        id: "active",
        office_start_time,
        office_end_time,
        clock_in_grace_period: Number(clock_in_grace_period),
        clock_out_grace_period: Number(clock_out_grace_period),
        clock_in_reminder_offset: Number(clock_in_reminder_offset),
        clock_out_reminder_offset: Number(clock_out_reminder_offset),
        attendance_recovery_enabled: Boolean(attendance_recovery_enabled),
        recovery_deadline,
        weekend_configuration,
        timezone,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      message: "Company Settings updated successfully!",
      settings,
    });
  } catch (error: any) {
    console.error("PUT /api/admin/settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
