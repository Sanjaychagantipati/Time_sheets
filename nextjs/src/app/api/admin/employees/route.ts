import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";
import bcryptjs from "bcryptjs";

// GET /api/admin/employees
export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const employeesList = await prisma.users.findMany({
      where: {
        role: {
          not: "ADMIN",
        },
      },
      include: { clients: true },
      orderBy: { name: "asc" },
    });

    const formatted = employeesList.map((emp: any) => ({
      id: emp.id,
      name: emp.name,
      username: emp.username,
      role: emp.role,
      clientCompany: emp.clients ? emp.clients.name : "N/A",
      clientId: emp.client_id,
      createdAt: emp.created_at,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/employees
export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { name, username, password, role, clientId } = body;

    if (!name || !username || !password || !role) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.users.findUnique({
      where: { username },
    });
    if (existing) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }

    const hashedPassword = bcryptjs.hashSync(password, 10);
    const userId = crypto.randomUUID();

    const newUser = await prisma.users.create({
      data: {
        id: userId,
        name,
        username,
        password_hash: hashedPassword,
        role: role.toUpperCase(),
        client_id: clientId ? parseInt(clientId) : null,
        hourly_rate: 0.0,
      },
      include: { clients: true },
    });

    return NextResponse.json(
      {
        id: newUser.id,
        name: newUser.name,
        username: newUser.username,
        role: newUser.role,
        clientCompany: newUser.clients ? newUser.clients.name : "N/A",
        clientId: newUser.client_id,
        createdAt: newUser.created_at,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
