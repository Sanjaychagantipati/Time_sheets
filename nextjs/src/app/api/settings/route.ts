import { NextResponse } from "next/server";
import { getCompanySettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await getCompanySettings();
    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
