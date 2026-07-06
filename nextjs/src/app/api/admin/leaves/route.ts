import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/admin/leaves
export async function GET(req: NextRequest) {
  const { response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const leavesList = await prisma.leaves.findMany({
      include: {
        users: {
          select: {
            id: true,
            name: true,
            username: true,
            role: true,
          },
        },
      },
      orderBy: { start_date: "desc" },
    });

    const formatted = leavesList.map((lf) => ({
      id: lf.id,
      userId: lf.user_id,
      employeeName: lf.users.name,
      leaveType: lf.leave_type,
      startDate: lf.start_date.toISOString().split("T")[0],
      endDate: lf.end_date.toISOString().split("T")[0],
      reason: lf.reason,
      createdAt: lf.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    console.error("GET /api/admin/leaves error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/leaves
export async function POST(req: NextRequest) {
  const { response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { userId, leaveType, startDate, endDate, reason } = body;

    if (!userId || !leaveType || !startDate || !endDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify employee exists
    const emp = await prisma.users.findUnique({
      where: { id: userId },
    });
    if (!emp) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    const leaveId = crypto.randomUUID();

    const leave = await prisma.leaves.create({
      data: {
        id: leaveId,
        user_id: userId,
        leave_type: leaveType,
        start_date: new Date(startDate),
        end_date: new Date(endDate),
        reason: reason || null,
      },
      include: {
        users: {
          select: {
            name: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Leave created successfully",
      leave: {
        id: leave.id,
        userId: leave.user_id,
        employeeName: leave.users.name,
        leaveType: leave.leave_type,
        startDate: leave.start_date.toISOString().split("T")[0],
        endDate: leave.end_date.toISOString().split("T")[0],
        reason: leave.reason,
        createdAt: leave.created_at,
      },
    });
  } catch (error: any) {
    console.error("POST /api/admin/leaves error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
