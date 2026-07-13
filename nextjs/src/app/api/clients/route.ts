import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

// GET /api/clients - Get all clients
export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN", "MANAGER"]);
  if (response) return response;

  try {
    const clientsList = await prisma.clients.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(clientsList);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/clients - Create client
export async function POST(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const body = await req.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    const existingByName = await prisma.clients.findFirst({
      where: { name: trimmedName },
    });
    if (existingByName) {
      return NextResponse.json({ error: "Client company already exists" }, { status: 400 });
    }

    // Auto-generate client code from name (exactly matching Spring Boot business logic)
    let code = trimmedName.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    if (code.length > 10) {
      code = code.substring(0, 10);
    } else if (!code) {
      code = "CL" + String(Math.floor(Math.random() * 10000)).padStart(4, "0");
    } else {
      let counter = 1;
      let baseCode = code;
      while (await prisma.clients.findUnique({ where: { code } })) {
        const suffix = String(counter);
        const limit = 10 - suffix.length;
        code = (baseCode.length > limit ? baseCode.substring(0, limit) : baseCode) + suffix;
        counter++;
      }
    }

    const newClient = await prisma.clients.create({
      data: {
        name: trimmedName,
        code,
        active: true,
      },
    });

    return NextResponse.json(newClient, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/clients - Delete client by name
export async function DELETE(req: NextRequest) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const name = req.nextUrl.searchParams.get("name");
    if (!name) {
      return NextResponse.json({ error: "Name parameter is required" }, { status: 400 });
    }

    const trimmedName = name.trim();

    const client = await prisma.clients.findFirst({
      where: { name: trimmedName },
    });
    if (!client) {
      return NextResponse.json({ error: "Client company not found" }, { status: 404 });
    }

    await prisma.clients.delete({
      where: { id: client.id },
    });

    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error: any) {
    if (error.code === "P2003") {
      return NextResponse.json({
        error: "Cannot delete client company because there are candidates or timesheets associated with it."
      }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
