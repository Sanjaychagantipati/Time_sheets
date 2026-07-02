import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "./jwt";

export interface AuthenticatedUser {
  id: string;
  username: string;
  role: string;
  name: string;
}

export async function getAuthUser(req: NextRequest): Promise<AuthenticatedUser | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  const token = authHeader.substring(7);
  return await verifyToken(token);
}

export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export async function checkAuth(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: AuthenticatedUser | null; response?: NextResponse }> {
  const user = await getAuthUser(req);
  if (!user) {
    return { user: null, response: unauthorizedResponse("Session expired or invalid token") };
  }

  // Allow roles matching check (normalize to uppercase)
  if (allowedRoles && !allowedRoles.map(r => r.toUpperCase()).includes(user.role.toUpperCase())) {
    return { user, response: forbiddenResponse("Access denied") };
  }

  return { user };
}
