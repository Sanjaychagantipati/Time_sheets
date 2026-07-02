import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { user, response } = await checkAuth(req); // All authenticated users can read active clients
  if (response) return response;

  try {
    const activeClients = await prisma.clients.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(activeClients);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
