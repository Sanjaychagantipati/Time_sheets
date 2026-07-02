import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { user, response } = await checkAuth(req, ["ADMIN"]);
  if (response) return response;

  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);
    const body = await req.json();
    const { name, code, active } = body;

    const existing = await prisma.clients.findUnique({
      where: { code },
    });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Client code already exists" }, { status: 400 });
    }

    const updatedClient = await prisma.clients.update({
      where: { id },
      data: {
        name,
        code,
        active: active !== undefined ? active : undefined,
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
