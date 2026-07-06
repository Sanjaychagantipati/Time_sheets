import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

// PUT /api/admin/leaves/[id]
export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = params;
    const body = await req.json();
    const { leaveType, startDate, endDate, reason } = body;

    // Verify leave exists
    const existing = await prisma.leaves.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    const updated = await prisma.leaves.update({
      where: { id },
      data: {
        leave_type: leaveType !== undefined ? leaveType : existing.leave_type,
        start_date: startDate !== undefined ? new Date(startDate) : existing.start_date,
        end_date: endDate !== undefined ? new Date(endDate) : existing.end_date,
        reason: reason !== undefined ? reason : existing.reason,
        updated_at: new Date(),
      },
      include: {
        users: {
          select: {
            name: true,
            clients: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      message: "Leave updated successfully",
      leave: {
        id: updated.id,
        userId: updated.user_id,
        employeeName: updated.users.name,
        clientCompany: updated.users.clients ? updated.users.clients.name : "N/A",
        leaveType: updated.leave_type,
        startDate: updated.start_date.toISOString().split("T")[0],
        endDate: updated.end_date.toISOString().split("T")[0],
        reason: updated.reason,
        createdAt: updated.created_at,
      },
    });
  } catch (error: any) {
    console.error("PUT /api/admin/leaves/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/leaves/[id]
export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = params;

    // Verify leave exists
    const existing = await prisma.leaves.findUnique({
      where: { id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Leave not found" }, { status: 404 });
    }

    await prisma.leaves.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Leave deleted successfully" });
  } catch (error: any) {
    console.error("DELETE /api/admin/leaves/[id] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
