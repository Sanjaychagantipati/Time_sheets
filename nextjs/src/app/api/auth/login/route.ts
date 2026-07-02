import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { signToken } from "@/lib/jwt";
import bcryptjs from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await prisma.users.findUnique({
      where: { username },
      include: { clients: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isMatch = bcryptjs.compareSync(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const token = await signToken({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });

    const userResponse = {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role.toLowerCase(),
      clientCompany: user.clients ? user.clients.name : "N/A",
      clientId: user.client_id,
      createdAt: user.created_at,
    };

    return NextResponse.json({
      token,
      userId: user.id,
      username: user.username,
      role: user.role.toLowerCase(),
      name: user.name,
      user: userResponse,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Authentication failed" },
      { status: 500 }
    );
  }
}
