import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import bcryptjs from "bcryptjs";

// PUT /api/admin/employees/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;
    const body = await req.json();
    const { name, username, password, role, clientId } = body;

    const existingUser = await prisma.users.findUnique({ where: { id } });
    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (username && username !== existingUser.username) {
      const usernameConflict = await prisma.users.findFirst({
        where: {
          username: {
            equals: username,
            mode: "insensitive",
          },
        },
      });
      if (usernameConflict) {
        return NextResponse.json({ error: "Username already exists" }, { status: 400 });
      }
    }

    const data: any = {
      name,
      username,
      role: role ? role.toUpperCase() : undefined,
      client_id: clientId ? parseInt(clientId) : null,
    };

    if (password && password.trim() !== "") {
      data.password_hash = bcryptjs.hashSync(password.toLowerCase(), 10);
    }

    const updatedUser = await prisma.users.update({
      where: { id },
      data,
      include: { clients: true },
    });

    return NextResponse.json({
      id: updatedUser.id,
      name: updatedUser.name,
      username: updatedUser.username,
      role: updatedUser.role,
      clientCompany: updatedUser.clients ? updatedUser.clients.name : "N/A",
      clientId: updatedUser.client_id,
      createdAt: updatedUser.created_at,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/employees/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id } = await params;
    await prisma.users.delete({
      where: { id },
    });
    return NextResponse.json({ message: "Employee deleted successfully" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
